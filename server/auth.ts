import type { Request, Response, NextFunction, Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as KakaoStrategy } from "passport-kakao";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

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

// 랜덤 문자열 생성 함수 (소문자 3자리)
function generateRandomString(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
    // "익명 주민 abc" 형식으로 username 생성
    let attempt = 0;
    const maxAttempts = 10;

    while (attempt < maxAttempts) {
      const randomSuffix = generateRandomString();
      const candidateUsername = `익명의 옥천 주민 ${randomSuffix}`;
      // displayName 정규화: 없거나 "미연동 계정"이면 username으로 저장
      const finalDisplayName =
        !displayName || displayName === "미연동 계정"
          ? candidateUsername
          : displayName;

      try {
        const insertData: any = {
          username: candidateUsername,
          email,
          displayName: finalDisplayName, // 정규화된 displayName (username 또는 소셜 닉네임)
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
        console.log(`[handleOAuthUser] Created new user:`, user.id, user.username, user.displayName, user.email);
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
  } else {
    // 기존 유저 로그인 시: displayName이 "미연동 계정"이면 username으로 업데이트
    if (user.displayName === "미연동 계정") {
      console.log(`[handleOAuthUser] Normalizing displayName for existing user:`, user.id);
      const updatedUsers = await db
        .update(users)
        .set({ displayName: user.username })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUsers[0];
      console.log(`[handleOAuthUser] Updated user displayName:`, user.id, user.displayName);
    }
  }

  return user;
}

export function setupAuth(app: Express) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;

  // Base URL 우선순위:
  // 1. BASE_URL (가장 명시적, 배포 환경에서 사용)
  // 2. PUBLIC_URL (대안)
  // 3. HOST (호스트명만 있는 경우)
  // 4. localhost (개발 환경 기본값)
  const port = process.env.PORT || '5000';
  let baseUrl: string;
  
  if (process.env.BASE_URL) {
    baseUrl = process.env.BASE_URL;
  } else if (process.env.PUBLIC_URL) {
    baseUrl = process.env.PUBLIC_URL;
  } else if (process.env.HOST) {
    const protocol = process.env.HOST.startsWith('http') ? '' : 'https://';
    baseUrl = `${protocol}${process.env.HOST}`;
  } else {
    baseUrl = `http://localhost:${port}`;
  }
  
  // baseUrl이 슬래시로 끝나면 제거
  baseUrl = baseUrl.replace(/\/$/, '');
  
  console.log(`[setupAuth] Using base URL: ${baseUrl}`);

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
            // 카카오 닉네임 우선 사용 (kakao_account.profile.nickname이 더 정확함)
            const kakaoNickname = kakaoAccount?.profile?.nickname || profile.displayName;
            console.log(`[Kakao OAuth] Profile data:`, {
              profileId: profile.id,
              profileDisplayName: profile.displayName,
              kakaoNickname: kakaoAccount?.profile?.nickname,
              finalDisplayName: kakaoNickname,
            });
            const user = await handleOAuthUser({
              id: profile.id,
              displayName: kakaoNickname, // 카카오 닉네임 사용
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
    console.log(`[deserializeUser] Attempting to deserialize user: ${id}`);
    
    // 캐시 확인
    const cached = userCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[deserializeUser] Found cached user: ${id}`);
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
          console.log(`[deserializeUser] Successfully deserialized user: ${id}`, {
            username: user.username,
            displayName: user.displayName,
          });
          done(null, user);
          return;
        } else {
          console.error(`[deserializeUser] User not found in database: ${id}`);
          done(null, null);
          return;
        }
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);
        const errorCode = error?.code || '';
        
        console.error(`[deserializeUser] Error (retries left: ${retries}):`, {
          id,
          error: errorMessage,
          code: errorCode,
        });
        
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
    console.error(`[deserializeUser] Failed to deserialize user after retries: ${id}`, {
      lastError: lastError?.message || lastError,
    });
    done(null, null);
  });

  app.use(passport.initialize());
  // passport.session()을 API 요청에만 적용하여 정적 파일 요청에서 불필요한 deserializeUser 호출 방지
  const sessionMiddleware = passport.session();
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      sessionMiddleware(req, res, next);
    } else {
      next();
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.id) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
}
