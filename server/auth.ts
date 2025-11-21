import type { Request, Response, NextFunction, Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as KakaoStrategy } from "passport-kakao";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email?: string | null;
      displayName?: string | null;
      avatarUrl?: string | null;
      isAdmin?: boolean;
    }
  }
}

interface OAuthProfile {
  id: string;
  displayName?: string;
  emails?: { value: string }[];
  photos?: { value: string }[];
  provider: "google" | "kakao";
}

async function handleOAuthUser(profile: OAuthProfile) {
  const email = profile.emails?.[0]?.value;
  const avatarUrl = profile.photos?.[0]?.value;
  const displayName = profile.displayName;

  console.log(`[handleOAuthUser] Processing ${profile.provider} user:`, {
    id: profile.id,
    email,
    displayName,
  });

  let user;

  if (profile.provider === "google") {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.googleId, profile.id))
      .limit(1);
    user = existingUsers[0];
    if (user) {
      console.log(`[handleOAuthUser] Found existing Google user:`, user.id, user.username);
    }
  } else {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.kakaoId, profile.id))
      .limit(1);
    user = existingUsers[0];
    if (user) {
      console.log(`[handleOAuthUser] Found existing Kakao user:`, user.id, user.username);
    }
  }

  if (!user) {
    console.log(`[handleOAuthUser] Creating new ${profile.provider} user`);
    let username = email?.split("@")[0] || `${profile.provider}_user`;
    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
      const suffix = attempt === 0 ? "" : `_${Date.now().toString(36).slice(-4)}`;
      const candidateUsername = `${username}${suffix}`;

      try {
        const insertData: any = {
          username: candidateUsername,
          email,
          displayName,
          avatarUrl,
          provider: profile.provider,
        };

        if (profile.provider === "google") {
          insertData.googleId = profile.id;
        } else {
          insertData.kakaoId = profile.id;
        }

        const newUsers = await db.insert(users).values(insertData).returning();
        user = newUsers[0];
        console.log(`[handleOAuthUser] Created new user:`, user.id, user.username, user.email);
        break;
      } catch (error: any) {
        if (error.code === "23505") {
          attempt++;
          if (attempt >= maxAttempts) {
            throw new Error("Failed to generate unique username");
          }
        } else {
          console.error(`[handleOAuthUser] Error creating user:`, error);
          throw error;
        }
      }
    }
  }

  return user;
}

export function setupAuth(app: Express) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;

  // 동적으로 포트를 가져오거나 환경 변수에서 가져옴
  const port = process.env.PORT || '5000';
  const baseUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : `http://localhost:${port}`;

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: `${baseUrl}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await handleOAuthUser({
              id: profile.id,
              displayName: profile.displayName,
              emails: profile.emails,
              photos: profile.photos,
              provider: "google",
            });
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  if (KAKAO_CLIENT_ID) {
    passport.use(
      new KakaoStrategy(
        {
          clientID: KAKAO_CLIENT_ID,
          clientSecret: KAKAO_CLIENT_SECRET || "",
          callbackURL: `${baseUrl}/api/auth/kakao/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const kakaoAccount = (profile as any)._json?.kakao_account;
            const user = await handleOAuthUser({
              id: profile.id,
              displayName: profile.displayName || kakaoAccount?.profile?.nickname,
              emails: kakaoAccount?.email ? [{ value: kakaoAccount.email }] : undefined,
              photos: kakaoAccount?.profile?.profile_image_url 
                ? [{ value: kakaoAccount.profile.profile_image_url }] 
                : undefined,
              provider: "kakao",
            });
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // 간단한 메모리 캐시 (개발 환경에서만 사용)
  const userCache = new Map<string, { user: any; timestamp: number }>();
  const CACHE_TTL = 60000; // 1분

  passport.deserializeUser(async (id: string, done) => {
    // 캐시 확인
    const cached = userCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      done(null, cached.user);
      return;
    }

    let retries = 2; // 재시도 횟수 감소
    let lastError: any = null;
    
    while (retries > 0) {
      try {
        // 타임아웃을 3초로 단축
        const userResults = await Promise.race([
          db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1),
          new Promise<any[]>((_, reject) => 
            setTimeout(() => reject(new Error("Database query timeout")), 3000)
          )
        ]);
        
        const user = userResults[0];
        if (user) {
          // 성공 시 캐시에 저장
          userCache.set(id, { user, timestamp: Date.now() });
          done(null, user);
          return;
        } else {
          done(null, null);
          return;
        }
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);
        const errorCode = error?.code || '';
        
        retries--;
        
        // ETIMEDOUT이나 WebSocket 에러인 경우에만 재시도
        const isRetryableError = 
          errorCode === 'ETIMEDOUT' || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('WebSocket') ||
          errorMessage.includes('ErrorEvent') ||
          errorMessage.includes('EHOSTUNREACH') ||
          (error?.errors && Array.isArray(error.errors));
        
        if (retries > 0 && isRetryableError) {
          // 재시도 전 대기 (짧은 대기 시간)
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        } else {
          break;
        }
      }
    }
    
    // 모든 재시도 실패 시 null 반환 (세션 무효화)
    // 에러를 done에 전달하지 않고 null을 반환하여 서버가 크래시되지 않도록 함
    // 에러 로깅을 최소화 (너무 많은 에러 로그 방지)
    done(null, null);
  });

  app.use(passport.initialize());
  app.use(passport.session());
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}
