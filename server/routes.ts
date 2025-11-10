import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertOpinionSchema, insertAgendaSchema, insertVoteSchema, insertReportSchema, insertClusterSchema, insertCommentSchema, updateCommentSchema, users, comments as dbComments } from "@shared/schema";
import { z } from "zod";
import { clusterOpinions } from "./clustering";
import { db } from "./db";
import { agendas, categories, clusters, opinionClusters, opinions } from "@shared/schema";
import { eq, and, desc, inArray, sql, isNull } from "drizzle-orm";
import { requireAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const GOOGLE_ENABLED = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const KAKAO_ENABLED = !!process.env.KAKAO_CLIENT_ID;

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
    return randomBytes(32).toString('hex');
  }

  // Google OAuth - only if enabled
  if (GOOGLE_ENABLED) {
    app.get("/api/auth/google", (req, res, next) => {
      const state = generateState();
      (req.session as any).oauthState = state;
      passport.authenticate("google", { 
        scope: ["profile", "email"],
        state
      })(req, res, next);
    });

    app.get("/api/auth/google/callback", (req, res, next) => {
      const sessionState = (req.session as any).oauthState;
      const callbackState = req.query.state;

      if (!sessionState || sessionState !== callbackState) {
        return res.status(403).send("Invalid state parameter - CSRF protection");
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
        return res.status(403).send("Invalid state parameter - CSRF protection");
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

      const newUsers = await db.insert(users).values({
        username: data.username,
        email: data.email,
        password: hashedPassword,
        provider: "local",
      }).returning();

      const user = newUsers[0];

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after registration" });
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
        return res.status(401).json({ error: "This account uses social login" });
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
      const { limit, offset, status, categoryId } = req.query;
      
      let query = db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          categoryId: opinions.categoryId,
          status: opinions.status,
          likes: opinions.likes,
          createdAt: opinions.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(opinions)
        .leftJoin(users, eq(opinions.userId, users.id))
        .orderBy(desc(opinions.createdAt));
      
      const conditions = [];
      if (status) {
        conditions.push(eq(opinions.status, status as any));
      }
      if (categoryId) {
        conditions.push(eq(opinions.categoryId, categoryId as string));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
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
      const { limit, offset, categoryId } = req.query;
      
      const conditions = [
        eq(opinions.status, "approved"),
        isNull(opinionClusters.id)
      ];
      
      if (categoryId) {
        conditions.push(eq(opinions.categoryId, categoryId as string));
      }
      
      let query: any = db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          categoryId: opinions.categoryId,
          status: opinions.status,
          likes: opinions.likes,
          createdAt: opinions.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(opinions)
        .leftJoin(users, eq(opinions.userId, users.id))
        .leftJoin(opinionClusters, eq(opinions.id, opinionClusters.opinionId))
        .where(and(...conditions))
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

  app.get("/api/opinions/:id", async (req, res) => {
    try {
      const opinionData = await db
        .select({
          id: opinions.id,
          userId: opinions.userId,
          type: opinions.type,
          content: opinions.content,
          voiceUrl: opinions.voiceUrl,
          categoryId: opinions.categoryId,
          status: opinions.status,
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
        linkedAgenda: opinionClustersData.length > 0 && opinionClustersData[0].agendaId
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
        return res.status(404).json({ error: "Comment not found or unauthorized" });
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
        return res.status(404).json({ error: "Comment not found or unauthorized" });
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
          createdAt: agendas.createdAt,
          updatedAt: agendas.updatedAt,
          category: categories,
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

  app.get("/api/agendas/:id", async (req, res) => {
    try {
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
          createdAt: agendas.createdAt,
          updatedAt: agendas.updatedAt,
          category: categories,
        })
        .from(agendas)
        .leftJoin(categories, eq(agendas.categoryId, categories.id))
        .where(eq(agendas.id, req.params.id));

      if (agendaData.length === 0) {
        return res.status(404).json({ error: "Agenda not found" });
      }

      await storage.incrementAgendaViewCount(req.params.id);
      res.json(agendaData[0]);
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

      const clusterIds = agendaClusters.map(c => c.id);
      
      const opinionClusterLinks = await db
        .select()
        .from(opinionClusters)
        .where(inArray(opinionClusters.clusterId, clusterIds));

      if (opinionClusterLinks.length === 0) {
        return res.json([]);
      }

      const opinionIds = opinionClusterLinks.map(oc => oc.opinionId);
      
      const agendaOpinions = await db
        .select()
        .from(opinions)
        .where(and(
          inArray(opinions.id, opinionIds),
          eq(opinions.status, "approved")
        ))
        .orderBy(desc(opinions.likes));

      res.json(agendaOpinions);
    } catch (error) {
      console.error("Error fetching agenda opinions:", error);
      res.status(500).json({ error: "Failed to fetch agenda opinions" });
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

  app.patch("/api/agendas/:id", async (req, res) => {
    try {
      const agenda = await storage.updateAgenda(req.params.id, req.body);
      if (!agenda) {
        return res.status(404).json({ error: "Agenda not found" });
      }
      res.json(agenda);
    } catch (error) {
      res.status(500).json({ error: "Failed to update agenda" });
    }
  });

  app.delete("/api/agendas/:id", async (req, res) => {
    const success = await storage.deleteAgenda(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Agenda not found" });
    }
    res.status(204).send();
  });

  app.post("/api/agendas/:id/bookmark", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
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

  app.delete("/api/agendas/:id/bookmark", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      await storage.deleteAgendaBookmark(userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove bookmark" });
    }
  });

  app.get("/api/agendas/:id/votes", async (req, res) => {
    const votes = await storage.getVotes(req.params.id);
    
    const agreeCount = votes.filter(v => v.voteType === "agree").length;
    const disagreeCount = votes.filter(v => v.voteType === "disagree").length;
    const neutralCount = votes.filter(v => v.voteType === "neutral").length;
    
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
      
      const existing = await storage.getVoteByUserAndAgenda(data.userId, data.agendaId);
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
    const vote = await storage.getVoteByUserAndAgenda(req.params.userId, req.params.agendaId);
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
      const data = insertClusterSchema.parse(req.body);
      const cluster = await storage.createCluster(data);
      res.status(201).json(cluster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create cluster" });
    }
  });

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
          categoryId: opinions.categoryId,
          status: opinions.status,
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
      const schema = z.object({
        categoryId: z.string().optional(),
      });
      
      const { categoryId } = schema.parse(req.body);
      const result = await clusterOpinions(categoryId);
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
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
        db.select({ count: sql<number>`count(*)::int` })
          .from(opinions)
          .where(sql`${opinions.createdAt} >= ${todayStart}`),
        db.select({ count: sql<number>`count(*)::int` })
          .from(opinions)
          .where(sql`${opinions.createdAt} >= ${weekStart}`),
        db.select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(sql`${users.createdAt} >= ${todayStart}`),
        db.select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(sql`${users.createdAt} >= ${weekStart}`),
        db.select({ count: sql<number>`count(*)::int` })
          .from(agendas)
          .where(eq(agendas.status, "active")),
        db.select({ count: sql<number>`count(*)::int` })
          .from(reports)
          .where(eq(reports.status, "pending")),
        db.select({
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
          sql`${users.username} ILIKE ${'%' + search + '%'} OR ${users.displayName} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'}`
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

  const httpServer = createServer(app);

  return httpServer;
}
