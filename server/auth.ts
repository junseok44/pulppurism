import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email?: string | null;
        displayName?: string | null;
        avatarUrl?: string | null;
      };
    }
  }
}

export interface SessionUser {
  id: string;
  username: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export async function getUserById(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user;
}

export async function getOrCreateUserByReplitId(replitId: string, profile: {
  email?: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
}) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.replitId, replitId))
    .limit(1);
  
  if (existing) {
    return existing;
  }

  const username = profile.username || profile.email?.split("@")[0] || `user_${replitId.slice(0, 8)}`;
  
  const [newUser] = await db
    .insert(users)
    .values({
      username,
      email: profile.email,
      displayName: profile.displayName,
      replitId,
      avatarUrl: profile.avatarUrl,
    })
    .returning();
  
  return newUser;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function attachUser(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (session?.userId) {
    getUserById(session.userId)
      .then(user => {
        if (user) {
          req.user = user;
        }
        next();
      })
      .catch(() => next());
  } else {
    next();
  }
}
