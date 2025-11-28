import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  pgEnum,
  unique,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const authProviderEnum = pgEnum("auth_provider", [
  "google",
  "kakao",
  "local",
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  provider: authProviderEnum("provider").notNull().default("local"),
  googleId: text("google_id").unique(),
  kakaoId: text("kakao_id").unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categoryEnum = pgEnum("category_type", [
  "education",
  "transportation",
  "environment",
  "safety",
  "welfare",
  "culture",
  "economy",
  "health",
  "housing",
  "administration",
  "other",
]);

export const categories = pgTable("categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  type: categoryEnum("type").notNull(),
  description: text("description"),
  icon: text("icons"),
});

export const opinionTypeEnum = pgEnum("opinion_type", ["text", "voice"]);

export const opinions = pgTable("opinions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: opinionTypeEnum("type").notNull().default("text"),
  content: text("content").notNull(),
  voiceUrl: text("voice_url"),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agendaStatusEnum = pgEnum("agenda_status", [
  "created",
  "voting",
  "proposing",
  "answered",
  "executing",
  "executed",
]);

export const agendas = pgTable("agendas", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id")
    .notNull()
    .references(() => categories.id),
  status: agendaStatusEnum("status").notNull().default("created"),
  voteCount: integer("vote_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  okinewsUrl: text("okinews_url"),
  referenceLinks: text("reference_links").array(),
  referenceFiles: text("reference_files").array(),
  regionalCases: text("regional_cases").array(),
  tags: text("tags").array(),
  response: jsonb("response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  okinews: boolean("okinews").notNull().default(false),
});

export const voteTypeEnum = pgEnum("vote_type", [
  "agree",
  "disagree",
  "neutral",
]);

export const votes = pgTable(
  "votes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    agendaId: varchar("agenda_id")
      .notNull()
      .references(() => agendas.id),
    voteType: voteTypeEnum("vote_type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserAgenda: unique().on(table.userId, table.agendaId),
  }),
);

export const clusterStatusEnum = pgEnum("cluster_status", [
  "pending",
  "reviewed",
  "converted",
]);

export const clusters = pgTable("clusters", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  status: clusterStatusEnum("status").notNull().default("pending"),
  opinionCount: integer("opinion_count").notNull().default(0),
  similarity: integer("similarity"),
  agendaId: varchar("agenda_id").references(() => agendas.id),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const opinionClusters = pgTable("opinion_clusters", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  opinionId: varchar("opinion_id")
    .notNull()
    .references(() => opinions.id),
  clusterId: varchar("cluster_id")
    .notNull()
    .references(() => clusters.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);
export const reportTypeEnum = pgEnum("report_type", [
  "spam",
  "inappropriate",
  "offensive",
  "misleading",
  "other",
]);

export const reports = pgTable("reports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id")
    .notNull()
    .references(() => users.id),
  opinionId: varchar("opinion_id").references(() => opinions.id),
  agendaId: varchar("agenda_id").references(() => agendas.id),
  commentId: varchar("comment_id").references(() => comments.id),
  reportType: reportTypeEnum("report_type").notNull(),
  description: text("description").notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const opinionLikes = pgTable(
  "opinion_likes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    opinionId: varchar("opinion_id")
      .notNull()
      .references(() => opinions.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserOpinion: unique().on(table.userId, table.opinionId),
  }),
);

export const agendaBookmarks = pgTable(
  "agenda_bookmarks",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    agendaId: varchar("agenda_id")
      .notNull()
      .references(() => agendas.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserAgenda: unique().on(table.userId, table.agendaId),
  }),
);

export const comments = pgTable("comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  opinionId: varchar("opinion_id")
    .notNull()
    .references(() => opinions.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const commentLikes = pgTable(
  "comment_likes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id),
    commentId: varchar("comment_id")
      .notNull()
      .references(() => comments.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueUserComment: unique().on(table.userId, table.commentId),
  }),
);

export const executionTimelineItems = pgTable("execution_timeline_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  agendaId: varchar("agenda_id")
    .notNull()
    .references(() => agendas.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  authorName: text("author_name").notNull().default("작성자"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});
export const insertOpinionSchema = createInsertSchema(opinions).omit({
  id: true,
  createdAt: true,
  likes: true,
});
// status 필드를 먼저 omit하고 나중에 새 enum으로 재정의
const baseAgendaSchema = createInsertSchema(agendas)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    voteCount: true,
    viewCount: true,
    status: true, // 기존 status를 omit
    response: true, // response도 omit하고 재정의
  })
  .extend({
    // 새로운 status enum 정의
    status: z.enum(["created", "voting", "proposing", "answered", "executing", "executed"]).optional(),
    startDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    okinewsUrl: z.string().nullish(),
    referenceLinks: z.array(z.string().url()).nullish(),
    referenceFiles: z.array(z.string()).nullish(),
    regionalCases: z.array(z.string()).nullish(),
    response: z
      .object({
        authorName: z.string().min(1, "답변자를 입력해주세요"),
        responseDate: z.string().optional(),
        content: z.string().min(1, "답변 내용을 입력해주세요"),
      })
      .nullish(),
  });

export const insertAgendaSchema = baseAgendaSchema;

export const updateAgendaSchema = baseAgendaSchema.partial();
export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});
export const insertClusterSchema = createInsertSchema(clusters).omit({
  id: true,
  createdAt: true,
});
export const insertOpinionClusterSchema = createInsertSchema(
  opinionClusters,
).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});
export const insertOpinionLikeSchema = createInsertSchema(opinionLikes).omit({
  id: true,
  createdAt: true,
});
export const insertAgendaBookmarkSchema = createInsertSchema(
  agendaBookmarks,
).omit({ id: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  likes: true,
});
export const updateCommentSchema = insertCommentSchema.pick({ content: true });
export const insertCommentLikeSchema = createInsertSchema(commentLikes).omit({
  id: true,
  createdAt: true,
});
export const insertExecutionTimelineItemSchema = createInsertSchema(
  executionTimelineItems,
)
  .omit({ id: true })
  .extend({
    createdAt: z
      .string()
      .optional()
      .transform((val) => {
        if (val) {
          // YYYY-MM-DD 형식의 날짜를 받아서 자정(00:00:00)으로 설정
          const date = new Date(val);
          date.setHours(0, 0, 0, 0);
          return date;
        }
        return new Date();
      }),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertOpinion = z.infer<typeof insertOpinionSchema>;
export type Opinion = typeof opinions.$inferSelect;
export type InsertAgenda = z.infer<typeof insertAgendaSchema>;
export type UpdateAgenda = z.infer<typeof updateAgendaSchema>;
export type Agenda = typeof agendas.$inferSelect;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;
export type InsertCluster = z.infer<typeof insertClusterSchema>;
export type Cluster = typeof clusters.$inferSelect;
export type InsertOpinionCluster = z.infer<typeof insertOpinionClusterSchema>;
export type OpinionCluster = typeof opinionClusters.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertOpinionLike = z.infer<typeof insertOpinionLikeSchema>;
export type OpinionLike = typeof opinionLikes.$inferSelect;
export type InsertAgendaBookmark = z.infer<typeof insertAgendaBookmarkSchema>;
export type AgendaBookmark = typeof agendaBookmarks.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type UpdateComment = z.infer<typeof updateCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertCommentLike = z.infer<typeof insertCommentLikeSchema>;
export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertExecutionTimelineItem = z.infer<
  typeof insertExecutionTimelineItemSchema
>;
export type ExecutionTimelineItem = typeof executionTimelineItems.$inferSelect;
