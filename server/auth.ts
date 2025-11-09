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

  let user;

  if (profile.provider === "google") {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.googleId, profile.id))
      .limit(1);
    user = existingUsers[0];
  } else {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.kakaoId, profile.id))
      .limit(1);
    user = existingUsers[0];
  }

  if (!user) {
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
        break;
      } catch (error: any) {
        if (error.code === "23505") {
          attempt++;
          if (attempt >= maxAttempts) {
            throw new Error("Failed to generate unique username");
          }
        } else {
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

  const baseUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "http://localhost:5000";

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

  passport.deserializeUser(async (id: string, done) => {
    try {
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, userResults[0] || null);
    } catch (error) {
      done(error);
    }
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
