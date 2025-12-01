import { db } from "./db";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  users,
  categories,
  opinions,
  agendas,
  votes,
  clusters,
  opinionClusters,
  reports,
  opinionLikes,
  agendaBookmarks,
  comments,
  commentLikes,
  executionTimelineItems,
  type InsertUser,
  type User,
  type InsertCategory,
  type Category,
  type InsertOpinion,
  type Opinion,
  type InsertAgenda,
  type Agenda,
  type InsertVote,
  type Vote,
  type InsertCluster,
  type Cluster,
  type InsertOpinionCluster,
  type OpinionCluster,
  type InsertReport,
  type Report,
  type InsertOpinionLike,
  type OpinionLike,
  type InsertAgendaBookmark,
  type AgendaBookmark,
  type InsertComment,
  type Comment,
  type InsertCommentLike,
  type CommentLike,
  type InsertExecutionTimelineItem,
  type ExecutionTimelineItem,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;

  getOpinions(options?: { limit?: number; offset?: number }): Promise<Opinion[]>;
  getUnclusteredOpinions(options?: { limit?: number; offset?: number }): Promise<Opinion[]>;
  getOpinion(id: string): Promise<Opinion | undefined>;
  getOpinionsByUser(userId: string): Promise<Opinion[]>;
  createOpinion(opinion: InsertOpinion): Promise<Opinion>;
  updateOpinion(id: string, opinion: Partial<InsertOpinion>): Promise<Opinion | undefined>;
  deleteOpinion(id: string): Promise<boolean>;
  incrementOpinionLikes(id: string): Promise<void>;
  decrementOpinionLikes(id: string): Promise<void>;

  getAgendas(options?: { limit?: number; offset?: number; status?: string; categoryId?: string }): Promise<Agenda[]>;
  getAgenda(id: string): Promise<Agenda | undefined>;
  createAgenda(agenda: InsertAgenda): Promise<Agenda>;
  updateAgenda(id: string, agenda: Partial<InsertAgenda>): Promise<Agenda | undefined>;
  deleteAgenda(id: string): Promise<boolean>;
  incrementAgendaVoteCount(id: string): Promise<void>;
  decrementAgendaVoteCount(id: string): Promise<void>;
  incrementAgendaViewCount(id: string): Promise<void>;

  getVotes(agendaId: string): Promise<Vote[]>;
  getVoteByUserAndAgenda(userId: string, agendaId: string): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: string, voteType: "agree" | "disagree" | "neutral"): Promise<Vote | undefined>;
  deleteVote(id: string): Promise<boolean>;

  getClusters(options?: { limit?: number; offset?: number; status?: string }): Promise<Cluster[]>;
  getCluster(id: string): Promise<Cluster | undefined>;
  createCluster(cluster: InsertCluster): Promise<Cluster>;
  updateCluster(id: string, cluster: Partial<InsertCluster>): Promise<Cluster | undefined>;
  deleteCluster(id: string): Promise<boolean>;

  getOpinionClustersByCluster(clusterId: string): Promise<OpinionCluster[]>;
  getOpinionClustersByOpinion(opinionId: string): Promise<OpinionCluster[]>;
  createOpinionCluster(opinionCluster: InsertOpinionCluster): Promise<OpinionCluster>;
  deleteOpinionCluster(id: string): Promise<boolean>;

  getReports(options?: { limit?: number; offset?: number; status?: string }): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: string): Promise<boolean>;

  getOpinionLike(userId: string, opinionId: string): Promise<OpinionLike | undefined>;
  createOpinionLike(like: InsertOpinionLike): Promise<OpinionLike>;
  deleteOpinionLike(userId: string, opinionId: string): Promise<boolean>;

  getAgendaBookmark(userId: string, agendaId: string): Promise<AgendaBookmark | undefined>;
  getAgendaBookmarksByUser(userId: string): Promise<AgendaBookmark[]>;
  createAgendaBookmark(bookmark: InsertAgendaBookmark): Promise<AgendaBookmark>;
  deleteAgendaBookmark(userId: string, agendaId: string): Promise<boolean>;

  getCommentsByOpinion(opinionId: string): Promise<Comment[]>;
  getComment(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, userId: string, data: { content: string }): Promise<Comment | undefined>;
  deleteComment(id: string, userId: string): Promise<boolean>;
  incrementCommentLikes(id: string): Promise<void>;
  decrementCommentLikes(id: string): Promise<void>;

  getCommentLike(userId: string, commentId: string): Promise<CommentLike | undefined>;
  createCommentLike(like: InsertCommentLike): Promise<CommentLike>;
  deleteCommentLike(userId: string, commentId: string): Promise<boolean>;

  getExecutionTimelineItems(agendaId: string): Promise<(ExecutionTimelineItem & { user: User })[]>;
  createExecutionTimelineItem(item: InsertExecutionTimelineItem): Promise<ExecutionTimelineItem>;
  updateExecutionTimelineItem(id: string, item: Partial<InsertExecutionTimelineItem>): Promise<ExecutionTimelineItem | null>;
  deleteExecutionTimelineItem(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async getOpinions(options?: { limit?: number; offset?: number }): Promise<Opinion[]> {
    let query: any = db.select().from(opinions).orderBy(desc(opinions.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }

  async getOpinion(id: string): Promise<Opinion | undefined> {
    const result = await db.select().from(opinions).where(eq(opinions.id, id)).limit(1);
    return result[0];
  }

  async getOpinionsByUser(userId: string): Promise<Opinion[]> {
    return db.select().from(opinions).where(eq(opinions.userId, userId)).orderBy(desc(opinions.createdAt));
  }

  async getUnclusteredOpinions(options?: { limit?: number; offset?: number }): Promise<Opinion[]> {
    let query: any = db
      .select({
        id: opinions.id,
        userId: opinions.userId,
        type: opinions.type,
        content: opinions.content,
        voiceUrl: opinions.voiceUrl,
        likes: opinions.likes,
        createdAt: opinions.createdAt,
      })
      .from(opinions)
      .leftJoin(opinionClusters, eq(opinions.id, opinionClusters.opinionId))
      .where(isNull(opinionClusters.id))
      .orderBy(desc(opinions.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }

  async createOpinion(opinion: InsertOpinion): Promise<Opinion> {
    const result = await db.insert(opinions).values(opinion).returning();
    return result[0];
  }

  async updateOpinion(id: string, opinion: Partial<InsertOpinion>): Promise<Opinion | undefined> {
    const result = await db.update(opinions).set(opinion).where(eq(opinions.id, id)).returning();
    return result[0];
  }

  async deleteOpinion(id: string): Promise<boolean> {
    // Delete in correct order to avoid foreign key constraint violations
    // 1. Delete opinion_clusters references
    await db.delete(opinionClusters).where(eq(opinionClusters.opinionId, id));
    
    // 2. Delete comments
    await db.delete(comments).where(eq(comments.opinionId, id));
    
    // 3. Delete opinion likes
    await db.delete(opinionLikes).where(eq(opinionLikes.opinionId, id));
    
    // 4. Finally delete the opinion itself
    const result = await db.delete(opinions).where(eq(opinions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async incrementOpinionLikes(id: string): Promise<void> {
    await db.update(opinions).set({ likes: sql`${opinions.likes} + 1` }).where(eq(opinions.id, id));
  }

  async decrementOpinionLikes(id: string): Promise<void> {
    await db.update(opinions).set({ likes: sql`${opinions.likes} - 1` }).where(eq(opinions.id, id));
  }

  async getAgendas(options?: { limit?: number; offset?: number; status?: string; categoryId?: string }): Promise<Agenda[]> {
    const conditions = [];
    
    if (options?.status) {
      conditions.push(eq(agendas.status, options.status as any));
    }
    if (options?.categoryId) {
      conditions.push(eq(agendas.categoryId, options.categoryId));
    }
    
    let query: any = db.select().from(agendas);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(agendas.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }

  async getAgenda(id: string): Promise<Agenda | undefined> {
    const result = await db.select().from(agendas).where(eq(agendas.id, id)).limit(1);
    return result[0];
  }

  async createAgenda(agenda: InsertAgenda): Promise<Agenda> {
    const result = await db.insert(agendas).values(agenda).returning();
    return result[0];
  }

  async updateAgenda(id: string, agenda: Partial<InsertAgenda>): Promise<Agenda | undefined> {
    const result = await db.update(agendas).set({ ...agenda, updatedAt: new Date() }).where(eq(agendas.id, id)).returning();
    return result[0];
  }

  async deleteAgenda(id: string): Promise<boolean> {
    // First, update clusters that reference this agenda (set agendaId to null)
    await db.update(clusters).set({ agendaId: null }).where(eq(clusters.agendaId, id));
    
    // Delete related votes
    await db.delete(votes).where(eq(votes.agendaId, id));
    
    // Delete related bookmarks
    await db.delete(agendaBookmarks).where(eq(agendaBookmarks.agendaId, id));
    
    // Delete related reports
    await db.delete(reports).where(eq(reports.agendaId, id));
    
    // Finally, delete the agenda
    const result = await db.delete(agendas).where(eq(agendas.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async incrementAgendaVoteCount(id: string): Promise<void> {
    await db.update(agendas).set({ voteCount: sql`${agendas.voteCount} + 1` }).where(eq(agendas.id, id));
  }

  async decrementAgendaVoteCount(id: string): Promise<void> {
    await db.update(agendas).set({ voteCount: sql`${agendas.voteCount} - 1` }).where(eq(agendas.id, id));
  }

  async incrementAgendaViewCount(id: string): Promise<void> {
    await db.update(agendas).set({ viewCount: sql`${agendas.viewCount} + 1` }).where(eq(agendas.id, id));
  }

  async getVotes(agendaId: string): Promise<Vote[]> {
    return db.select().from(votes).where(eq(votes.agendaId, agendaId)).orderBy(desc(votes.createdAt));
  }

  async getVoteByUserAndAgenda(userId: string, agendaId: string): Promise<Vote | undefined> {
    const result = await db.select().from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.agendaId, agendaId)))
      .limit(1);
    return result[0];
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const result = await db.insert(votes).values(vote).returning();
    return result[0];
  }

  async updateVote(id: string, voteType: "agree" | "disagree" | "neutral"): Promise<Vote | undefined> {
    const result = await db.update(votes).set({ voteType }).where(eq(votes.id, id)).returning();
    return result[0];
  }

  async deleteVote(id: string): Promise<boolean> {
    const result = await db.delete(votes).where(eq(votes.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getClusters(options?: { limit?: number; offset?: number; status?: string }): Promise<Cluster[]> {
    let query: any = db
      .select({
        id: clusters.id,
        title: clusters.title,
        summary: clusters.summary,
        categoryId: clusters.categoryId,
        status: clusters.status,
        opinionCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${opinionClusters}
          WHERE ${opinionClusters.clusterId} = ${clusters.id}
        )`.as("opinion_count"),
        similarity: clusters.similarity,
        agendaId: clusters.agendaId,
        tags: clusters.tags,
        createdAt: clusters.createdAt,
      })
      .from(clusters);
    
    if (options?.status) {
      query = query.where(eq(clusters.status, options.status as any));
    }
    
    query = query.orderBy(desc(clusters.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }

  async getCluster(id: string): Promise<Cluster | undefined> {
    const result = await db.select().from(clusters).where(eq(clusters.id, id)).limit(1);
    return result[0];
  }

  async createCluster(cluster: InsertCluster): Promise<Cluster> {
    const result = await db.insert(clusters).values(cluster).returning();
    return result[0];
  }

  async updateCluster(id: string, cluster: Partial<InsertCluster>): Promise<Cluster | undefined> {
    const result = await db.update(clusters).set(cluster).where(eq(clusters.id, id)).returning();
    return result[0];
  }

  async deleteCluster(id: string): Promise<boolean> {
    // Delete in correct order to avoid foreign key constraint violations
    // 1. Delete opinion_clusters references (this makes opinions unclustered again)
    await db.delete(opinionClusters).where(eq(opinionClusters.clusterId, id));
    
    // 2. Finally delete the cluster itself
    const result = await db.delete(clusters).where(eq(clusters.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getOpinionClustersByCluster(clusterId: string): Promise<OpinionCluster[]> {
    return db.select().from(opinionClusters).where(eq(opinionClusters.clusterId, clusterId)).orderBy(desc(opinionClusters.createdAt));
  }

  async getOpinionClustersByOpinion(opinionId: string): Promise<OpinionCluster[]> {
    return db.select().from(opinionClusters).where(eq(opinionClusters.opinionId, opinionId)).orderBy(desc(opinionClusters.createdAt));
  }

  async createOpinionCluster(opinionCluster: InsertOpinionCluster): Promise<OpinionCluster> {
    const result = await db.insert(opinionClusters).values(opinionCluster).returning();
    return result[0];
  }

  async deleteOpinionCluster(id: string): Promise<boolean> {
    const result = await db.delete(opinionClusters).where(eq(opinionClusters.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getReports(options?: { limit?: number; offset?: number; status?: string }): Promise<Report[]> {
    let query: any = db.select().from(reports);
    
    if (options?.status) {
      query = query.where(eq(reports.status, options.status as any));
    }
    
    query = query.orderBy(desc(reports.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }

  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    return result[0];
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(report).returning();
    return result[0];
  }

  async updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined> {
    const result = await db.update(reports).set(report).where(eq(reports.id, id)).returning();
    return result[0];
  }

  async deleteReport(id: string): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getOpinionLike(userId: string, opinionId: string): Promise<OpinionLike | undefined> {
    const result = await db.select().from(opinionLikes)
      .where(and(eq(opinionLikes.userId, userId), eq(opinionLikes.opinionId, opinionId)))
      .limit(1);
    return result[0];
  }

  async createOpinionLike(like: InsertOpinionLike): Promise<OpinionLike> {
    const result = await db.insert(opinionLikes).values(like).returning();
    return result[0];
  }

  async deleteOpinionLike(userId: string, opinionId: string): Promise<boolean> {
    const result = await db.delete(opinionLikes)
      .where(and(eq(opinionLikes.userId, userId), eq(opinionLikes.opinionId, opinionId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAgendaBookmark(userId: string, agendaId: string): Promise<AgendaBookmark | undefined> {
    const result = await db.select().from(agendaBookmarks)
      .where(and(eq(agendaBookmarks.userId, userId), eq(agendaBookmarks.agendaId, agendaId)))
      .limit(1);
    return result[0];
  }

  async getAgendaBookmarksByUser(userId: string): Promise<AgendaBookmark[]> {
    return db.select().from(agendaBookmarks).where(eq(agendaBookmarks.userId, userId)).orderBy(desc(agendaBookmarks.createdAt));
  }

  async createAgendaBookmark(bookmark: InsertAgendaBookmark): Promise<AgendaBookmark> {
    const result = await db.insert(agendaBookmarks).values(bookmark).returning();
    return result[0];
  }

  async deleteAgendaBookmark(userId: string, agendaId: string): Promise<boolean> {
    const result = await db.delete(agendaBookmarks)
      .where(and(eq(agendaBookmarks.userId, userId), eq(agendaBookmarks.agendaId, agendaId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCommentsByOpinion(opinionId: string): Promise<Comment[]> {
    return db.select().from(comments)
      .where(eq(comments.opinionId, opinionId))
      .orderBy(desc(comments.createdAt));
  }

  async getComment(id: string): Promise<Comment | undefined> {
    const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return result[0];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async updateComment(id: string, userId: string, data: { content: string }): Promise<Comment | undefined> {
    const result = await db.update(comments)
      .set({ content: data.content })
      .where(and(eq(comments.id, id), eq(comments.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(comments)
      .where(and(eq(comments.id, id), eq(comments.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async incrementCommentLikes(id: string): Promise<void> {
    await db.update(comments)
      .set({ likes: sql`${comments.likes} + 1` })
      .where(eq(comments.id, id));
  }

  async decrementCommentLikes(id: string): Promise<void> {
    await db.update(comments)
      .set({ likes: sql`${comments.likes} - 1` })
      .where(eq(comments.id, id));
  }

  async getCommentLike(userId: string, commentId: string): Promise<CommentLike | undefined> {
    const result = await db.select().from(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)))
      .limit(1);
    return result[0];
  }

  async createCommentLike(like: InsertCommentLike): Promise<CommentLike> {
    const result = await db.insert(commentLikes).values(like).returning();
    return result[0];
  }

  async deleteCommentLike(userId: string, commentId: string): Promise<boolean> {
    const result = await db.delete(commentLikes)
      .where(and(eq(commentLikes.userId, userId), eq(commentLikes.commentId, commentId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getExecutionTimelineItems(agendaId: string): Promise<ExecutionTimelineItem[]> {
    const result = await db
      .select()
      .from(executionTimelineItems)
      .where(eq(executionTimelineItems.agendaId, agendaId))
      .orderBy(asc(executionTimelineItems.createdAt));
    
    return result;
  }

  async createExecutionTimelineItem(item: InsertExecutionTimelineItem): Promise<ExecutionTimelineItem> {
    const result = await db.insert(executionTimelineItems).values(item).returning();
    return result[0];
  }

  async updateExecutionTimelineItem(
    id: string,
    item: Partial<InsertExecutionTimelineItem>
  ): Promise<ExecutionTimelineItem | null> {
    const result = await db
      .update(executionTimelineItems)
      .set(item)
      .where(eq(executionTimelineItems.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteExecutionTimelineItem(id: string): Promise<boolean> {
    const result = await db.delete(executionTimelineItems).where(eq(executionTimelineItems.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
