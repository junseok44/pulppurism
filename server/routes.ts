import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import {
  insertOpinionSchema,
  insertAgendaSchema,
  updateAgendaSchema,
  insertVoteSchema,
  insertReportSchema,
  insertClusterSchema,
  insertCommentSchema,
  updateCommentSchema,
  users,
  comments as dbComments,
} from "@shared/schema";
import { z } from "zod";
import { clusterOpinions } from "./clustering";
import { db } from "./db";
import {
  agendas,
  categories,
  clusters,
  opinionClusters,
  opinions,
  reports,
  opinionLikes,
  agendaBookmarks,
} from "@shared/schema";
import { eq, and, desc, inArray, sql, isNull } from "drizzle-orm";
import { requireAuth } from "./auth";
import multer from "multer";
import { ObjectStorageService } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  const GOOGLE_ENABLED = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const KAKAO_ENABLED = !!process.env.KAKAO_CLIENT_ID;

  const upload = multer({ storage: multer.memoryStorage() });
  const objectStorageService = new ObjectStorageService();

  // Auth routes
  app.get("/api/auth/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.get("/api/auth/providers", (req, res) => {
    res.json({
      google: GOOGLE_ENABLED,
      kakao: KAKAO_ENABLED,
    });
  });

  // Helper to generate OAuth state
  function generateState() {
    return randomBytes(32).toString("hex");
  }

  // Google OAuth - only if enabled
  if (GOOGLE_ENABLED) {
    app.get("/api/auth/google", (req, res, next) => {
      const state = generateState();
      (req.session as any).oauthState = state;
      passport.authenticate("google", {
        scope: ["profile", "email"],
        state,
      })(req, res, next);
    });

    app.get("/api/auth/google/callback", (req, res, next) => {
      const sessionState = (req.session as any).oauthState;
      const callbackState = req.query.state;

      if (!sessionState || sessionState !== callbackState) {
        return res
          .status(403)
          .send("Invalid state parameter - CSRF protection");
      }

      delete (req.session as any).oauthState;

      passport.authenticate("google", (err: any, user: any, info: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.redirect("/");
        }
        if (!user) {
          return res.redirect("/");
        }

        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration failed:", err);
            return res.redirect("/");
          }

          req.login(user, (err) => {
            if (err) {
              console.error("Login failed:", err);
              return res.redirect("/");
            }
            res.redirect("/");
          });
        });
      })(req, res, next);
    });
  }

  // Kakao OAuth - only if enabled
  if (KAKAO_ENABLED) {
    app.get("/api/auth/kakao", (req, res, next) => {
      const state = generateState();
      (req.session as any).oauthState = state;
      passport.authenticate("kakao", { state })(req, res, next);
    });

    app.get("/api/auth/kakao/callback", (req, res, next) => {
      const sessionState = (req.session as any).oauthState;
      const callbackState = req.query.state;

      if (!sessionState || sessionState !== callbackState) {
        return res
          .status(403)
          .send("Invalid state parameter - CSRF protection");
      }

      delete (req.session as any).oauthState;

      passport.authenticate("kakao", (err: any, user: any, info: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.redirect("/");
        }
        if (!user) {
          return res.redirect("/");
        }

        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration failed:", err);
            return res.redirect("/");
          }

          req.login(user, (err) => {
            if (err) {
              console.error("Login failed:", err);
              return res.redirect("/");
            }
            res.redirect("/");
          });
        });
      })(req, res, next);
    });
  }

  // Email/Password Authentication
  const registerSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6),
  });

  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUsers = await db
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          password: hashedPassword,
          provider: "local",
        })
        .returning();

      const user = newUsers[0];

      req.login(user, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Login failed after registration" });
        }
        res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUsers.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = existingUsers[0];

      if (!user.password) {
        return res
          .status(401)
          .json({ error: "This account uses social login" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ success: true });
      });
    });
  });
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get("/api/opinions", async (req, res) => {
    try {
      const { limit, offset } = req.query;

      let query = db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          likes: opinions.likes,
          createdAt: opinions.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(opinions)
        .leftJoin(users, eq(opinions.userId, users.id))
        .orderBy(desc(opinions.createdAt));

      if (limit) {
        query = query.limit(parseInt(limit as string)) as any;
      }
      if (offset) {
        query = query.offset(parseInt(offset as string)) as any;
      }

      const result = await query;
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch opinions:", error);
      res.status(500).json({ error: "Failed to fetch opinions" });
    }
  });

  app.get("/api/opinions/unclustered", async (req, res) => {
    try {
      const { limit, offset } = req.query;

      let query: any = db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          likes: opinions.likes,
          createdAt: opinions.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(opinions)
        .leftJoin(users, eq(opinions.userId, users.id))
        .leftJoin(opinionClusters, eq(opinions.id, opinionClusters.opinionId))
        .where(isNull(opinionClusters.id))
        .orderBy(desc(opinions.createdAt));

      if (limit) {
        query = query.limit(parseInt(limit as string));
      }
      if (offset) {
        query = query.offset(parseInt(offset as string));
      }

      const result = await query;
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch unclustered opinions:", error);
      res.status(500).json({ error: "Failed to fetch unclustered opinions" });
    }
  });

  app.get("/api/opinions/my", requireAuth, async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const userId = req.user!.id;

      let query: any = db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          likes: opinions.likes,
          createdAt: opinions.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(opinions)
        .leftJoin(users, eq(opinions.userId, users.id))
        .where(eq(opinions.userId, userId))
        .orderBy(desc(opinions.createdAt));

      if (limit) {
        query = query.limit(parseInt(limit as string));
      }
      if (offset) {
        query = query.offset(parseInt(offset as string));
      }

      const opinionsData = await query;

      const opinionIds = opinionsData.map((o: any) => o.id);

      const commentCounts =
        opinionIds.length > 0
          ? await db
              .select({
                opinionId: dbComments.opinionId,
                count: sql<number>`count(*)::int`.as("count"),
              })
              .from(dbComments)
              .where(inArray(dbComments.opinionId, opinionIds))
              .groupBy(dbComments.opinionId)
          : [];

      const likesData =
        opinionIds.length > 0
          ? await db
              .select({
                opinionId: opinionLikes.opinionId,
              })
              .from(opinionLikes)
              .where(
                and(
                  inArray(opinionLikes.opinionId, opinionIds),
                  eq(opinionLikes.userId, userId),
                ),
              )
          : [];

      const likesSet = new Set(likesData.map((l) => l.opinionId));
      const commentCountMap = new Map(
        commentCounts.map((c) => [c.opinionId, c.count]),
      );

      const result = opinionsData.map((opinion: any) => ({
        ...opinion,
        commentCount: commentCountMap.get(opinion.id) || 0,
        isLiked: likesSet.has(opinion.id),
      }));

      res.json(result);
    } catch (error) {
      console.error("Failed to fetch my opinions:", error);
      res.status(500).json({ error: "Failed to fetch my opinions" });
    }
  });

  app.get("/api/opinions/liked", requireAuth, async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const userId = req.user!.id;

      let query: any = db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          likes: opinions.likes,
          createdAt: opinions.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(opinions)
        .leftJoin(users, eq(opinions.userId, users.id))
        .innerJoin(opinionLikes, eq(opinions.id, opinionLikes.opinionId))
        .where(eq(opinionLikes.userId, userId))
        .orderBy(desc(opinions.createdAt));

      if (limit) {
        query = query.limit(parseInt(limit as string));
      }
      if (offset) {
        query = query.offset(parseInt(offset as string));
      }

      const opinionsData = await query;

      const opinionIds = opinionsData.map((o: any) => o.id);

      const commentCounts =
        opinionIds.length > 0
          ? await db
              .select({
                opinionId: dbComments.opinionId,
                count: sql<number>`count(*)::int`.as("count"),
              })
              .from(dbComments)
              .where(inArray(dbComments.opinionId, opinionIds))
              .groupBy(dbComments.opinionId)
          : [];

      const commentCountMap = new Map(
        commentCounts.map((c) => [c.opinionId, c.count]),
      );

      const result = opinionsData.map((opinion: any) => ({
        ...opinion,
        commentCount: commentCountMap.get(opinion.id) || 0,
        isLiked: true,
      }));

      res.json(result);
    } catch (error) {
      console.error("Failed to fetch liked opinions:", error);
      res.status(500).json({ error: "Failed to fetch liked opinions" });
    }
  });

  app.get("/api/opinions/:id", async (req, res) => {
    try {
      const opinionData = await db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          likes: opinions.likes,
          createdAt: opinions.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(opinions)
        .leftJoin(users, eq(opinions.userId, users.id))
        .where(eq(opinions.id, req.params.id))
        .limit(1);

      if (!opinionData || opinionData.length === 0) {
        return res.status(404).json({ error: "Opinion not found" });
      }

      const opinionClustersData = await db
        .select({
          clusterId: opinionClusters.clusterId,
          clusterTitle: clusters.title,
          clusterSummary: clusters.summary,
          agendaId: clusters.agendaId,
          agendaTitle: agendas.title,
          agendaStatus: agendas.status,
          categoryName: categories.name,
        })
        .from(opinionClusters)
        .leftJoin(clusters, eq(opinionClusters.clusterId, clusters.id))
        .leftJoin(agendas, eq(clusters.agendaId, agendas.id))
        .leftJoin(categories, eq(agendas.categoryId, categories.id))
        .where(eq(opinionClusters.opinionId, req.params.id))
        .limit(1);

      const result = {
        ...opinionData[0],
        linkedAgenda:
          opinionClustersData.length > 0 && opinionClustersData[0].agendaId
            ? {
                id: opinionClustersData[0].agendaId,
                title: opinionClustersData[0].agendaTitle,
                category: opinionClustersData[0].categoryName,
                status: opinionClustersData[0].agendaStatus,
                clusterId: opinionClustersData[0].clusterId,
                clusterName: opinionClustersData[0].clusterTitle,
              }
            : null,
      };

      res.json(result);
    } catch (error) {
      console.error("Failed to fetch opinion:", error);
      res.status(500).json({ error: "Failed to fetch opinion" });
    }
  });

  app.post(
    "/api/opinions/transcribe",
    requireAuth,
    upload.single("audio"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No audio file provided" });
        }

        const formData = new FormData();
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
        formData.append("file", blob, "audio.webm");
        formData.append("model", "whisper-1");
        formData.append("language", "ko");

        const response = await fetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: formData,
          },
        );

        if (!response.ok) {
          const error = await response.text();
          console.error("OpenAI Whisper API error:", error);
          return res
            .status(response.status)
            .json({ error: "Transcription failed" });
        }

        const data = await response.json();
        res.json({ text: data.text });
      } catch (error) {
        console.error("Transcription error:", error);
        res.status(500).json({ error: "Failed to transcribe audio" });
      }
    },
  );

  app.post("/api/opinions", async (req, res) => {
    try {
      const data = insertOpinionSchema.parse(req.body);
      const opinion = await storage.createOpinion(data);
      res.status(201).json(opinion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create opinion" });
    }
  });

  app.patch("/api/opinions/:id", async (req, res) => {
    try {
      const opinion = await storage.updateOpinion(req.params.id, req.body);
      if (!opinion) {
        return res.status(404).json({ error: "Opinion not found" });
      }
      res.json(opinion);
    } catch (error) {
      res.status(500).json({ error: "Failed to update opinion" });
    }
  });

  app.delete("/api/opinions/:id", async (req, res) => {
    const success = await storage.deleteOpinion(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Opinion not found" });
    }
    res.status(204).send();
  });

  app.post("/api/opinions/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const existing = await storage.getOpinionLike(userId, req.params.id);
      if (existing) {
        return res.status(400).json({ error: "Already liked" });
      }

      await storage.createOpinionLike({ userId, opinionId: req.params.id });
      await storage.incrementOpinionLikes(req.params.id);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to like opinion" });
    }
  });

  app.delete("/api/opinions/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const success = await storage.deleteOpinionLike(userId, req.params.id);
      if (success) {
        await storage.decrementOpinionLikes(req.params.id);
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to unlike opinion" });
    }
  });

  app.get("/api/opinions/:id/like", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const like = await storage.getOpinionLike(userId, req.params.id);
      res.json({ liked: !!like });
    } catch (error) {
      console.error("Failed to check opinion like:", error);
      res.status(500).json({ error: "Failed to check opinion like" });
    }
  });

  app.get("/api/opinions/:id/comments", async (req, res) => {
    try {
      const comments = await db
        .select({
          id: dbComments.id,
          opinionId: dbComments.opinionId,
          userId: dbComments.userId,
          content: dbComments.content,
          likes: dbComments.likes,
          createdAt: dbComments.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(dbComments)
        .leftJoin(users, eq(dbComments.userId, users.id))
        .where(eq(dbComments.opinionId, req.params.id))
        .orderBy(desc(dbComments.createdAt));

      res.json(comments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/opinions/:id/comments", async (req, res) => {
    try {
      const data = insertCommentSchema.parse({
        ...req.body,
        opinionId: req.params.id,
      });
      const comment = await storage.createComment(data);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.patch("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const data = updateCommentSchema.parse(req.body);
      const userId = req.user!.id;

      const comment = await storage.updateComment(req.params.id, userId, data);
      if (!comment) {
        return res
          .status(404)
          .json({ error: "Comment not found or unauthorized" });
      }
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const success = await storage.deleteComment(req.params.id, userId);
      if (!success) {
        return res
          .status(404)
          .json({ error: "Comment not found or unauthorized" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.post("/api/comments/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const existing = await storage.getCommentLike(userId, req.params.id);
      if (existing) {
        return res.status(400).json({ error: "Already liked" });
      }

      await storage.createCommentLike({ userId, commentId: req.params.id });
      await storage.incrementCommentLikes(req.params.id);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Failed to like comment:", error);
      res.status(500).json({ error: "Failed to like comment" });
    }
  });

  app.delete("/api/comments/:id/like", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const success = await storage.deleteCommentLike(userId, req.params.id);
      if (success) {
        await storage.decrementCommentLikes(req.params.id);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to unlike comment:", error);
      res.status(500).json({ error: "Failed to unlike comment" });
    }
  });

  app.get("/api/agendas", async (req, res) => {
    try {
      const { limit, offset, status, categoryId } = req.query;

      const conditions = [];
      if (status) {
        conditions.push(eq(agendas.status, status as any));
      }
      if (categoryId) {
        conditions.push(eq(agendas.categoryId, categoryId as string));
      }

      let query = db
        .select({
          id: agendas.id,
          title: agendas.title,
          description: agendas.description,
          categoryId: agendas.categoryId,
          status: agendas.status,
          voteCount: agendas.voteCount,
          viewCount: agendas.viewCount,
          startDate: agendas.startDate,
          endDate: agendas.endDate,
          referenceLinks: agendas.referenceLinks,
          referenceFiles: agendas.referenceFiles,
          createdAt: agendas.createdAt,
          updatedAt: agendas.updatedAt,
          category: categories,
          okinews: agendas.okinews,
        })
        .from(agendas)
        .leftJoin(categories, eq(agendas.categoryId, categories.id));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      query = query.orderBy(desc(agendas.createdAt)) as any;

      if (limit) {
        query = query.limit(parseInt(limit as string)) as any;
      }
      if (offset) {
        query = query.offset(parseInt(offset as string)) as any;
      }

      const results = await query;
      res.json(results);
    } catch (error) {
      console.error("Error fetching agendas:", error);
      res.status(500).json({ error: "Failed to fetch agendas" });
    }
  });

  app.get("/api/agendas/my-opinions", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const result = await db
        .selectDistinct({
          id: agendas.id,
          title: agendas.title,
          description: agendas.description,
          categoryId: agendas.categoryId,
          categoryName: categories.name,
          status: agendas.status,
          voteCount: agendas.voteCount,
          viewCount: agendas.viewCount,
          startDate: agendas.startDate,
          endDate: agendas.endDate,
          referenceLinks: agendas.referenceLinks,
          referenceFiles: agendas.referenceFiles,
          createdAt: agendas.createdAt,
          updatedAt: agendas.updatedAt,
          okinews: agendas.okinews,
        })
        .from(agendas)
        .leftJoin(categories, eq(agendas.categoryId, categories.id))
        .innerJoin(clusters, eq(agendas.id, clusters.agendaId))
        .innerJoin(opinionClusters, eq(clusters.id, opinionClusters.clusterId))
        .innerJoin(opinions, eq(opinionClusters.opinionId, opinions.id))
        .where(eq(opinions.userId, userId))
        .orderBy(desc(agendas.createdAt));

      res.json(result);
    } catch (error) {
      console.error("Failed to fetch my agendas:", error);
      res.status(500).json({ error: "Failed to fetch my agendas" });
    }
  });

  app.get("/api/agendas/bookmarked", requireAuth, async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const userId = req.user!.id;

      let query: any = db
        .select({
          id: agendas.id,
          title: agendas.title,
          description: agendas.description,
          categoryId: agendas.categoryId,
          categoryName: categories.name,
          status: agendas.status,
          voteCount: agendas.voteCount,
          viewCount: agendas.viewCount,
          startDate: agendas.startDate,
          endDate: agendas.endDate,
          referenceLinks: agendas.referenceLinks,
          referenceFiles: agendas.referenceFiles,
          createdAt: agendas.createdAt,
          updatedAt: agendas.updatedAt,
        })
        .from(agendas)
        .leftJoin(categories, eq(agendas.categoryId, categories.id))
        .innerJoin(agendaBookmarks, eq(agendas.id, agendaBookmarks.agendaId))
        .where(eq(agendaBookmarks.userId, userId))
        .orderBy(desc(agendas.createdAt));

      if (limit) {
        query = query.limit(parseInt(limit as string));
      }
      if (offset) {
        query = query.offset(parseInt(offset as string));
      }

      const result = await query;
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch bookmarked agendas:", error);
      res.status(500).json({ error: "Failed to fetch bookmarked agendas" });
    }
  });

  app.get("/api/agendas/:id", async (req, res) => {
    try {
      const userId = req.user?.id;

      const agendaData = await db
        .select({
          id: agendas.id,
          title: agendas.title,
          description: agendas.description,
          categoryId: agendas.categoryId,
          status: agendas.status,
          voteCount: agendas.voteCount,
          viewCount: agendas.viewCount,
          startDate: agendas.startDate,
          endDate: agendas.endDate,
          okinewsUrl: agendas.okinewsUrl,
          referenceLinks: agendas.referenceLinks,
          referenceFiles: agendas.referenceFiles,
          regionalCases: agendas.regionalCases,
          createdAt: agendas.createdAt,
          updatedAt: agendas.updatedAt,
          category: categories,
          bookmarkId: agendaBookmarks.id,
        })
        .from(agendas)
        .leftJoin(categories, eq(agendas.categoryId, categories.id))
        .leftJoin(
          agendaBookmarks,
          userId
            ? and(
                eq(agendaBookmarks.agendaId, agendas.id),
                eq(agendaBookmarks.userId, userId),
              )
            : sql`false`,
        )
        .where(eq(agendas.id, req.params.id));

      if (agendaData.length === 0) {
        return res.status(404).json({ error: "Agenda not found" });
      }

      await storage.incrementAgendaViewCount(req.params.id);

      const result = agendaData[0];
      const isBookmarked = !!result.bookmarkId;
      const { bookmarkId, ...agendaWithoutBookmarkId } = result;

      res.json({ ...agendaWithoutBookmarkId, isBookmarked });
    } catch (error) {
      console.error("Error fetching agenda:", error);
      res.status(500).json({ error: "Failed to fetch agenda" });
    }
  });

  app.get("/api/agendas/:id/opinions", async (req, res) => {
    try {
      const agendaClusters = await db
        .select()
        .from(clusters)
        .where(eq(clusters.agendaId, req.params.id));

      if (agendaClusters.length === 0) {
        return res.json([]);
      }

      const clusterIds = agendaClusters.map((c) => c.id);

      const opinionClusterLinks = await db
        .select()
        .from(opinionClusters)
        .where(inArray(opinionClusters.clusterId, clusterIds));

      if (opinionClusterLinks.length === 0) {
        return res.json([]);
      }

      const opinionIds = opinionClusterLinks.map((oc) => oc.opinionId);

      const agendaOpinions = await db
        .select()
        .from(opinions)
        .where(inArray(opinions.id, opinionIds))
        .orderBy(desc(opinions.likes));

      res.json(agendaOpinions);
    } catch (error) {
      console.error("Error fetching agenda opinions:", error);
      res.status(500).json({ error: "Failed to fetch agenda opinions" });
    }
  });

  app.post("/api/agendas/:id/opinions", requireAuth, async (req, res) => {
    try {
      const agendaId = req.params.id;
      const userId = req.user!.id;

      const opinionData = insertOpinionSchema.parse({
        ...req.body,
        userId,
      });

      const opinion = await storage.createOpinion(opinionData);

      const agendaClusters = await db
        .select()
        .from(clusters)
        .where(eq(clusters.agendaId, agendaId));

      if (agendaClusters.length > 0) {
        for (const cluster of agendaClusters) {
          await db.insert(opinionClusters).values({
            opinionId: opinion.id,
            clusterId: cluster.id,
          });
        }
      }

      res.status(201).json(opinion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating opinion for agenda:", error);
      res.status(500).json({ error: "Failed to create opinion" });
    }
  });

  app.post("/api/agendas", async (req, res) => {
    try {
      const data = insertAgendaSchema.parse(req.body);
      const agenda = await storage.createAgenda(data);
      res.status(201).json(agenda);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create agenda" });
    }
  });

  app.patch("/api/agendas/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      console.log("PATCH /api/agendas/:id - Request body:", JSON.stringify(req.body, null, 2));
      const data = updateAgendaSchema.parse(req.body);
      console.log("PATCH /api/agendas/:id - Parsed data:", JSON.stringify(data, null, 2));
      const agenda = await storage.updateAgenda(req.params.id, data);
      if (!agenda) {
        return res.status(404).json({ error: "Agenda not found" });
      }
      console.log("PATCH /api/agendas/:id - Updated agenda:", JSON.stringify({ id: agenda.id, okinewsUrl: agenda.okinewsUrl, regionalCases: agenda.regionalCases }, null, 2));
      res.json(agenda);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("PATCH /api/agendas/:id - Validation error:", error.errors);
        return res.status(400).json({ error: error.errors });
      }
      console.error("PATCH /api/agendas/:id - Error:", error);
      res.status(500).json({ error: "Failed to update agenda" });
    }
  });

  app.post(
    "/api/agendas/:id/files",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.user?.isAdmin) {
          return res.status(403).json({ error: "Admin access required" });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const agendaId = req.params.id;
        const agenda = await storage.getAgenda(agendaId);
        if (!agenda) {
          return res.status(404).json({ error: "Agenda not found" });
        }

        const timestamp = Date.now();
        const filename = `agendas/${agendaId}/${timestamp}-${req.file.originalname}`;

        const fullPath = await objectStorageService.uploadFile(
          filename,
          req.file.buffer,
        );

        const publicUrl = `/public-objects/${filename}`;

        const currentFiles = agenda.referenceFiles || [];
        const updatedAgenda = await storage.updateAgenda(agendaId, {
          referenceFiles: [...currentFiles, publicUrl],
        });

        res.json({
          success: true,
          fileUrl: publicUrl,
          agenda: updatedAgenda,
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    },
  );

  app.delete("/api/agendas/:id", async (req, res) => {
    const success = await storage.deleteAgenda(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Agenda not found" });
    }
    res.status(204).send();
  });

  app.post("/api/agendas/:id/bookmark", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const existing = await storage.getAgendaBookmark(userId, req.params.id);
      if (existing) {
        return res.status(400).json({ error: "Already bookmarked" });
      }

      await storage.createAgendaBookmark({ userId, agendaId: req.params.id });
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to bookmark agenda" });
    }
  });

  app.delete("/api/agendas/:id/bookmark", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      await storage.deleteAgendaBookmark(userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove bookmark" });
    }
  });

  app.get("/api/agendas/:id/votes", async (req, res) => {
    const votes = await storage.getVotes(req.params.id);

    const agreeCount = votes.filter((v) => v.voteType === "agree").length;
    const disagreeCount = votes.filter((v) => v.voteType === "disagree").length;
    const neutralCount = votes.filter((v) => v.voteType === "neutral").length;

    res.json({
      total: votes.length,
      agree: agreeCount,
      disagree: disagreeCount,
      neutral: neutralCount,
    });
  });

  app.post("/api/votes", async (req, res) => {
    try {
      const data = insertVoteSchema.parse(req.body);

      const existing = await storage.getVoteByUserAndAgenda(
        data.userId,
        data.agendaId,
      );
      if (existing) {
        if (existing.voteType !== data.voteType) {
          const updated = await storage.updateVote(existing.id, data.voteType);
          return res.json(updated);
        }
        return res.json(existing);
      }

      const vote = await storage.createVote(data);
      await storage.incrementAgendaVoteCount(data.agendaId);
      res.status(201).json(vote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create vote" });
    }
  });

  app.get("/api/votes/user/:userId/agenda/:agendaId", async (req, res) => {
    const vote = await storage.getVoteByUserAndAgenda(
      req.params.userId,
      req.params.agendaId,
    );
    res.json(vote || null);
  });

  app.get("/api/clusters", async (req, res) => {
    const { limit, offset, status } = req.query;
    const clusters = await storage.getClusters({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      status: status as string,
    });
    res.json(clusters);
  });

  app.get("/api/clusters/:id", async (req, res) => {
    const cluster = await storage.getCluster(req.params.id);
    if (!cluster) {
      return res.status(404).json({ error: "Cluster not found" });
    }
    res.json(cluster);
  });

  app.post("/api/clusters", async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1),
        summary: z.string().min(1),
        opinionIds: z.array(z.string()).min(1),
      });

      const { title, summary, opinionIds } = schema.parse(req.body);

      const cluster = await storage.createCluster({
        title,
        summary,
        opinionCount: opinionIds.length,
        similarity: null,
        agendaId: null,
      });

      for (const opinionId of opinionIds) {
        await storage.createOpinionCluster({
          opinionId,
          clusterId: cluster.id,
        });
      }

      res.status(201).json(cluster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create cluster" });
    }
  });

  app.post("/api/clusters/:id/opinions", async (req, res) => {
    try {
      const schema = z.object({
        opinionIds: z.array(z.string()).min(1),
      });

      const { opinionIds } = schema.parse(req.body);

      for (const opinionId of opinionIds) {
        await storage.createOpinionCluster({
          opinionId,
          clusterId: req.params.id,
        });
      }

      const [updatedCluster] = await db
        .update(clusters)
        .set({ opinionCount: sql`opinion_count + ${opinionIds.length}` })
        .where(eq(clusters.id, req.params.id))
        .returning();

      res.json(updatedCluster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add opinions to cluster" });
    }
  });

  app.delete(
    "/api/clusters/:clusterId/opinions/:opinionId",
    requireAuth,
    async (req, res) => {
      try {
        const { clusterId, opinionId } = req.params;

        await db
          .delete(opinionClusters)
          .where(
            and(
              eq(opinionClusters.clusterId, clusterId),
              eq(opinionClusters.opinionId, opinionId),
            ),
          );

        await db
          .update(clusters)
          .set({ opinionCount: sql`GREATEST(opinion_count - 1, 0)` })
          .where(eq(clusters.id, clusterId));

        res.json({ success: true });
      } catch (error) {
        console.error("Failed to remove opinion from cluster:", error);
        res
          .status(500)
          .json({ error: "Failed to remove opinion from cluster" });
      }
    },
  );

  app.patch("/api/clusters/:id", async (req, res) => {
    try {
      const cluster = await storage.updateCluster(req.params.id, req.body);
      if (!cluster) {
        return res.status(404).json({ error: "Cluster not found" });
      }
      res.json(cluster);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cluster" });
    }
  });

  app.delete("/api/clusters/:id", async (req, res) => {
    const success = await storage.deleteCluster(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Cluster not found" });
    }
    res.status(204).send();
  });

  app.get("/api/clusters/:id/opinions", async (req, res) => {
    try {
      const opinionsWithUsers = await db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          likes: opinions.likes,
          createdAt: opinions.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(opinionClusters)
        .innerJoin(opinions, eq(opinionClusters.opinionId, opinions.id))
        .leftJoin(users, eq(opinions.userId, users.id))
        .where(eq(opinionClusters.clusterId, req.params.id))
        .orderBy(desc(opinions.createdAt));

      res.json(opinionsWithUsers);
    } catch (error) {
      console.error("Failed to fetch cluster opinions:", error);
      res.status(500).json({ error: "Failed to fetch cluster opinions" });
    }
  });

  app.post("/api/clusters/generate", async (req, res) => {
    try {
      const result = await clusterOpinions();
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Clustering error:", error);
      res.status(500).json({ error: "Failed to generate clusters" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const data = insertReportSchema.parse(req.body);
      const report = await storage.createReport(data);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.get("/api/reports", async (req, res) => {
    const { limit, offset, status } = req.query;
    const reports = await storage.getReports({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      status: status as string,
    });
    res.json(reports);
  });

  app.patch("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.updateReport(req.params.id, req.body);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);

      const [
        todayOpinions,
        weekOpinions,
        todayUsers,
        weekUsers,
        activeAgendas,
        pendingReports,
        recentClusters,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(opinions)
          .where(sql`${opinions.createdAt} >= ${todayStart}`),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(opinions)
          .where(sql`${opinions.createdAt} >= ${weekStart}`),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(sql`${users.createdAt} >= ${todayStart}`),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(sql`${users.createdAt} >= ${weekStart}`),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(agendas)
          .where(eq(agendas.status, "voting")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(reports)
          .where(eq(reports.status, "pending")),
        db
          .select({
            id: clusters.id,
            title: clusters.title,
            summary: clusters.summary,
            opinionCount: clusters.opinionCount,
            similarity: clusters.similarity,
            createdAt: clusters.createdAt,
          })
          .from(clusters)
          .orderBy(desc(clusters.createdAt))
          .limit(5),
      ]);

      res.json({
        today: {
          newOpinions: todayOpinions[0]?.count || 0,
          newUsers: todayUsers[0]?.count || 0,
        },
        week: {
          newOpinions: weekOpinions[0]?.count || 0,
          newUsers: weekUsers[0]?.count || 0,
        },
        activeAgendas: activeAgendas[0]?.count || 0,
        pendingReports: pendingReports[0]?.count || 0,
        recentClusters,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/users/me/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;

      const myOpinionsCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(opinions)
        .where(eq(opinions.userId, userId));

      const likedOpinionsCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(opinionLikes)
        .where(eq(opinionLikes.userId, userId));

      const myAgendasCountResult = await db
        .select({ count: sql<number>`count(distinct ${agendas.id})::int` })
        .from(agendas)
        .innerJoin(clusters, eq(agendas.id, clusters.agendaId))
        .innerJoin(opinionClusters, eq(clusters.id, opinionClusters.clusterId))
        .innerJoin(opinions, eq(opinionClusters.opinionId, opinions.id))
        .where(eq(opinions.userId, userId));

      const bookmarkedAgendasCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agendaBookmarks)
        .where(eq(agendaBookmarks.userId, userId));

      res.json({
        myOpinionsCount: myOpinionsCountResult[0]?.count || 0,
        likedOpinionsCount: likedOpinionsCountResult[0]?.count || 0,
        myAgendasCount: myAgendasCountResult[0]?.count || 0,
        bookmarkedAgendasCount: bookmarkedAgendasCountResult[0]?.count || 0,
      });
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const { limit, offset, search } = req.query;

      let query = db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          provider: users.provider,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      if (search) {
        query = query.where(
          sql`${users.username} ILIKE ${"%" + search + "%"} OR ${users.displayName} ILIKE ${"%" + search + "%"} OR ${users.email} ILIKE ${"%" + search + "%"}`,
        ) as any;
      }

      if (limit) {
        query = query.limit(parseInt(limit as string)) as any;
      }

      if (offset) {
        query = query.offset(parseInt(offset as string)) as any;
      }

      const usersList = await query;
      res.json(usersList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/dev/seed-opinions", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }

      const userId = req.user.id;

      const clusterableGroups = [
        {
          theme: "주차 문제",
          opinions: [
            "아파트 주차장이 너무 부족합니다. 주민들이 주차하기 어려워요.",
            "우리 동네 주차 공간이 부족해서 불법주차가 많습니다.",
            "공영주차장을 더 많이 만들어주세요. 주차난이 심각합니다.",
            "주차장 부족으로 골목길에 차가 가득합니다. 해결책이 필요해요.",
            "지하 주차장을 확충해주세요. 지상 주차 공간이 모자랍니다.",
            "주차 공간 확보를 위한 다층 주차타워 건설을 제안합니다.",
          ],
        },
        {
          theme: "어린이 놀이터 안전",
          opinions: [
            "어린이 놀이터 시설이 낡아서 위험합니다. 새 놀이기구로 교체해주세요.",
            "놀이터 안전 점검을 정기적으로 실시해주세요. 사고가 날까 걱정됩니다.",
            "놀이터 바닥이 딱딱해서 아이들이 다칠 수 있어요. 안전매트를 깔아주세요.",
            "어린이 놀이터 CCTV를 설치해서 안전을 강화해주세요.",
            "놀이터 놀이기구가 오래되어 녹이 슬었습니다. 교체가 시급해요.",
            "놀이터 울타리가 낮아서 아이들이 도로로 뛰어나갈 수 있어요. 울타리를 높여주세요.",
          ],
        },
        {
          theme: "야간 가로등",
          opinions: [
            "골목길이 너무 어두워요. 가로등을 더 많이 설치해주세요.",
            "밤에 집에 가는 길이 무섭습니다. LED 가로등을 늘려주세요.",
            "주택가 가로등이 어두워 범죄 위험이 있어요. 밝은 조명이 필요합니다.",
            "가로등 간격이 너무 넓어서 어두운 구간이 많습니다.",
            "가로등 전구가 나간 곳이 많은데 빨리 교체해주세요.",
            "보안등을 추가로 설치해서 밤길을 밝게 해주세요.",
          ],
        },
        {
          theme: "쓰레기 분리수거",
          opinions: [
            "분리수거함이 부족해서 쓰레기가 넘칩니다. 더 많이 설치해주세요.",
            "재활용 쓰레기통을 늘려주세요. 현재 수량으로는 부족합니다.",
            "음식물 쓰레기통 냄새가 심합니다. 자주 수거해주세요.",
            "분리수거 안내 표지판을 명확하게 만들어주세요. 헷갈립니다.",
            "대형 폐기물 수거를 더 자주 해주세요. 방치된 것들이 많아요.",
            "쓰레기 불법 투기 단속을 강화해주세요. CCTV 설치가 필요합니다.",
          ],
        },
        {
          theme: "버스 배차 간격",
          opinions: [
            "출퇴근 시간 버스 배차 간격이 너무 길어요. 더 자주 다니게 해주세요.",
            "버스를 20분이나 기다렸습니다. 배차 간격을 줄여주세요.",
            "마을버스 배차가 불규칙해서 불편합니다. 정시 운행 부탁드립니다.",
            "저녁 시간대 버스가 너무 안 와요. 증차가 필요합니다.",
            "심야 시간 버스 배차를 늘려주세요. 늦게 퇴근하는 사람들이 많아요.",
            "버스 실시간 도착 정보가 부정확합니다. 시스템 개선이 필요해요.",
          ],
        },
        {
          theme: "도서관 운영",
          opinions: [
            "도서관 운영시간을 연장해주세요. 평일 저녁에도 이용하고 싶어요.",
            "주말에 도서관이 일찍 닫아서 아쉽습니다. 운영시간 확대 부탁드립니다.",
            "도서관 좌석이 부족합니다. 열람실을 확충해주세요.",
            "도서관 책이 너무 오래되었어요. 신간 도서를 많이 구비해주세요.",
            "전자책 대여 서비스를 도입해주세요. 편리할 것 같아요.",
            "도서관에 스터디룸을 만들어주세요. 그룹 스터디 공간이 필요합니다.",
          ],
        },
      ];

      const singleOpinions = [
        "반려동물 놀이터를 만들어주세요. 강아지와 산책할 곳이 없어요.",
        "공공 와이파이 존을 확대해주세요. 관공서나 공원에 설치 부탁드립니다.",
        "벽화 거리를 조성해서 동네를 아름답게 꾸며주세요.",
        "어르신들을 위한 게이트볼장을 만들어주세요.",
        "자전거 보관대를 더 많이 설치해주세요. 자전거 도난이 걱정됩니다.",
        "공원에 운동기구를 더 설치해주세요. 건강 증진에 도움이 됩니다.",
        "경로당 시설을 개선해주세요. 어르신들이 쾌적하게 이용할 수 있게요.",
        "횡단보도 신호 시간을 늘려주세요. 어르신들이 건너기에 짧아요.",
        "공중화장실을 더 깨끗하게 관리해주세요.",
        "길고양이 급식소를 허가해주세요. 동물 복지도 중요합니다.",
        "벤치를 더 많이 설치해주세요. 쉴 곳이 부족합니다.",
        "꽃길 조성 사업을 추진해주세요. 아름다운 동네 만들기.",
        "소음 단속을 강화해주세요. 심야 시간 공사 소음이 심합니다.",
        "공원에 분수대를 만들어주세요. 여름에 시원할 것 같아요.",
        "학원가 불법 주정차 단속을 강화해주세요.",
        "지역 농산물 직거래 장터를 정기적으로 열어주세요.",
        "마을 축제를 개최해주세요. 주민 화합의 장이 되었으면 합니다.",
        "공영 수영장을 만들어주세요. 저렴하게 수영을 배우고 싶어요.",
      ];

      const opinionsToInsert = [];

      for (const group of clusterableGroups) {
        for (const text of group.opinions) {
          opinionsToInsert.push({
            userId,
            content: text,
          });
        }
      }

      for (const text of singleOpinions) {
        opinionsToInsert.push({
          userId,
          content: text,
        });
      }

      await db.insert(opinions).values(opinionsToInsert);

      res.json({
        success: true,
        count: opinionsToInsert.length,
        message: `${opinionsToInsert.length}개의 의견이 생성되었습니다.`,
      });
    } catch (error) {
      console.error("Failed to seed opinions:", error);
      res.status(500).json({ error: "Failed to seed opinions" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const schema = z.object({
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const [updatedUser] = await db
        .update(users)
        .set(data)
        .where(eq(users.id, req.params.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to update user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
