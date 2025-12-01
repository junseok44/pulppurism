import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { storage } from "./storage";

const viteLogger = createLogger();

const DEFAULT_TITLE = "두런두런 옥천마루";
const DEFAULT_DESCRIPTION = "일상의 아이디어가 모여 정책을 만드는, 주민 참여 기반 정책 제안 서비스입니다.";
const DEFAULT_IMAGE = "/og-image.png";

/**
 * 사이트 URL을 가져오는 함수 (요청에서 추출)
 */
function getSiteUrl(req?: express.Request): string {
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL;
  }
  if (req) {
    const protocol = req.protocol;
    const host = req.get("host");
    return `${protocol}://${host}`;
  }
  return "";
}

/**
 * HTML 특수문자 이스케이프
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 메타 태그를 HTML에 주입하는 함수
 */
async function injectMetaTags(html: string, url: string, req?: express.Request): Promise<string> {
  // 안건 상세 페이지인지 확인 (/agendas/:id)
  const agendaMatch = url.match(/^\/agendas\/([^\/]+)$/);
  
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  let image = DEFAULT_IMAGE;
  
  if (agendaMatch) {
    const agendaId = agendaMatch[1];
    try {
      const agenda = await storage.getAgenda(agendaId);
      if (agenda) {
        // 안건 상세 페이지: 제목은 기본값, 설명은 안건 제목
        description = agenda.title;
      }
    } catch (error) {
      // 안건 조회 실패 시 기본값 사용
      console.error("Failed to fetch agenda for meta tags:", error);
    }
  }
  
  // 절대 URL로 변환
  const siteUrl = getSiteUrl(req);
  const imageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;
  const pageUrl = url.startsWith("http") ? url : `${siteUrl}${url}`;
  
  // 메타 태그 업데이트
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${escapeHtml(title)}</title>`
  );
  
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );
  
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][^"']*["']\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  
  html = html.replace(
    /<meta\s+property=["']og:description["']\s+content=["'][^"']*["']\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );
  
  html = html.replace(
    /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>/,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`
  );
  
  html = html.replace(
    /<meta\s+property=["']og:url["']\s+content=["'][^"']*["']\s*\/?>/,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`
  );
  
  html = html.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'][^"']*["']\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  );
  
  html = html.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'][^"']*["']\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );
  
  html = html.replace(
    /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>/,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`
  );
  
  return html;
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    // API 경로는 제외
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      let page = await vite.transformIndexHtml(url, template);
      
      // 서버 사이드에서 메타 태그 주입
      page = await injectMetaTags(page, url, req);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // 프로덕션 빌드에서는 dist/index.js가 실행되므로,
  // dist/index.js 기준으로 dist/public을 찾아야 함
  // import.meta.dirname은 esbuild 번들에서 예상과 다를 수 있으므로
  // process.cwd()를 사용하여 작업 디렉토리 기준으로 경로 설정
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res, next) => {
    // API 경로는 제외
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    try {
      const indexPath = path.resolve(distPath, "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");

      // 서버 사이드에서 메타 태그 주입
      html = await injectMetaTags(html, req.originalUrl, req);

      // 런타임 환경변수를 HTML에 주입
      const envScript = `
    <script>
      window.__ENV__ = {
        VITE_GA_MEASUREMENT_ID: ${JSON.stringify(process.env.VITE_GA_MEASUREMENT_ID || "")},
        VITE_KAKAO_JAVASCRIPT_KEY: ${JSON.stringify(process.env.VITE_KAKAO_JAVASCRIPT_KEY || "")},
      };
    </script>`;

      // </head> 태그 앞에 환경변수 스크립트 삽입
      html = html.replace("</head>", `${envScript}\n    </head>`);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      next(error);
    }
  });
}
