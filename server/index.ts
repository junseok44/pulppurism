import 'dotenv/config';  

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.set('trust proxy', 1);

const isProduction = process.env.NODE_ENV === 'production';

// 세션 스토어 설정 (Neon 호환성 문제로 메모리 스토어 사용)
// Neon 데이터베이스는 WebSocket 연결만 지원하므로 connect-pg-simple과 호환되지 않음
// DB 연결 실패 시 서버가 크래시되지 않도록 메모리 스토어 사용
// 주의: 메모리 스토어는 서버 재시작 시 세션이 사라지고, 여러 인스턴스 간 공유되지 않음

app.use(session({
  // store를 지정하지 않으면 기본적으로 메모리 스토어 사용
  secret: process.env.SESSION_SECRET || 'civic-engagement-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  proxy: isProduction,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax',
  },
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// 전역 에러 핸들러 - 처리되지 않은 Promise rejection 방지
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('[Unhandled Rejection]', reason);
  // 서버가 크래시되지 않도록 에러만 로깅
});

process.on('uncaughtException', (error: Error) => {
  console.error('[Uncaught Exception]', error);
  // 서버가 크래시되지 않도록 에러만 로깅
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('[Express Error Handler]', err);
    res.status(status).json({ message });
    // throw err 제거 - 서버가 크래시되지 않도록 함
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
