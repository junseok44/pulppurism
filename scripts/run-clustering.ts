#!/usr/bin/env node
/**
 * Clustering Script for Cloud Functions
 * 
 * This script can be run independently in a Cloud Function instance.
 * It performs opinion clustering using OpenAI embeddings.
 * 
 * Required environment variables:
 * - DATABASE_URL: PostgreSQL connection string (not required in TEST_MODE)
 * - OPENAI_API_KEY: OpenAI API key for embeddings and title generation
 * 
 * Usage:
 *   tsx scripts/run-clustering.ts
 *   or
 *   node dist/scripts/run-clustering.js (after building)
 * 
 * Test Mode:
 *   TEST_MODE=true tsx scripts/run-clustering.ts
 *   - Uses test data instead of database
 *   - Outputs results to console only (no DB writes)
 */

import "dotenv/config";
import OpenAI from "openai";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, desc, isNull } from "drizzle-orm";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

// ============================================================================
// Types
// ============================================================================

interface Opinion {
  id: string;
  userId: string;
  type: "text" | "voice";
  content: string;
  voiceUrl: string | null;
  likes: number;
  createdAt: Date;
}

interface OpinionWithEmbedding {
  opinion: Opinion;
  embedding: number[];
}

interface Cluster {
  id: string;
  title: string;
  summary: string;
  categoryId: string | null;
  status: "pending" | "reviewed" | "converted";
  opinionCount: number;
  similarity: number | null;
  agendaId: string | null;
  tags: string[] | null;
  createdAt: Date;
}

interface InsertCluster {
  title: string;
  summary: string;
  opinionCount: number;
  similarity: number | null;
  agendaId: string | null;
}

interface InsertOpinionCluster {
  opinionId: string;
  clusterId: string;
}

const similarityThreshold = 0.5;
const minClusterSize = 2;
const textEmbeddingModel = "text-embedding-3-large";

// ============================================================================
// Test Mode Configuration
// ============================================================================

const TEST_MODE = process.env.TEST_MODE === "true";

// Test data - modify this to test with different opinions
const TEST_OPINIONS: Opinion[] = [
  {
    id: "test-1",
    userId: "user-1",
    type: "text",
    content: "영동에 순환버스가 생겼는데요. 영동읍내를 전기저상버스로 계속 순환하니 지역에서도 많이 이용하는 것 같아요. 옥천읍내도 순환버스가 있었으면 좋겠습니다. 자가용 없는 사람도 읍내 출입할 때 편하게 이용하면 좋을 것 같아요. 옥천읍내 순환버스 30분 단위로 다니면 더 좋습니다. 순환버스 도입 요청합니다.",
    voiceUrl: null,
    likes: 8,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "test-2",
    userId: "user-2",
    type: "text",
    content: "면 소재지에서 떨어진 마을 주민들은 슈퍼 가기도 힘듭니다. 버스를 몇번 갈아타고 가야할 만큼 어려운 곳도 있어요. 그래서 영광이나 포천, 그리고 가까운 영동에서도 하고 있는 가가호호 이동장터를 도입하면 좋을 것 같습니다. 2주에 한번씩이라도 면 소재지에서 떨어진 마을을 순회하는 이동장터 도입 강력하게 요청합니다.",
    voiceUrl: null,
    likes: 12,
    createdAt: new Date("2024-01-02"),
  },
  {
    id: "test-3",
    userId: "user-3",
    type: "text",
    content: "생활비도 벌어야 하는데 부모님 간병까지 하려니 쉽지 않네요. 병원까지도 아니고, 야간에도 운영하는 공공돌봄센터가 생기면 부모님 간병을 맡길 수 있어 좋을 것 같아요.",
    voiceUrl: null,
    likes: 15,
    createdAt: new Date("2024-01-03"),
  },
  {
    id: "test-4",
    userId: "user-4",
    type: "text",
    content: "옥천에는 전동킥보드 사고로 지난해 6월 한 청소년이 사망한 일이 있습니다. 조금 더 안전하게 청소년 이동권을 지켜낼 필요가 있을 거 같아요. 옥천에는 평지도 있지만, 오르막도 제법 있어서 김해시처럼 공용전기자전거가 있으면 킥보드보다 안전하게 이동할 수 있지 않을까요? 전기공용자전거와 안전한 자전거길 확보도 부탁드립니다.",
    voiceUrl: null,
    likes: 7,
    createdAt: new Date("2024-01-04"),
  },
  {
    id: "test-5",
    userId: "user-5",
    type: "text",
    content: "쓰레기 소각으로 00리 주변에 탄 내가 자주 나서 단속을 강화해주셨으면 좋겠어요.",
    voiceUrl: null,
    likes: 4,
    createdAt: new Date("2024-01-05"),
  },
  {
    id: "test-6",
    userId: "user-6",
    type: "text",
    content: "마을에 빈집이 많아서 분위기가 너무 어두워요 ㅠㅠ 해결이 시급합니다.",
    voiceUrl: null,
    likes: 9,
    createdAt: new Date("2024-01-06"),
  },
  {
    id: "test-7",
    userId: "user-7",
    type: "text",
    content: "면에는 병원이 없는데, 나이가 들수록 읍에 가기 어려워져 걱정입니다. 이러다 위급할 때 어떻게 되는 거 아닌가 싶고… 보건소 같은 거라도 있으면 좋으련만",
    voiceUrl: null,
    likes: 11,
    createdAt: new Date("2024-01-07"),
  },
  {
    id: "test-8",
    userId: "user-8",
    type: "text",
    content: "겨울이라 밖에 나가기도 어렵고 적적하네요. 연말을 맞이해 마을 카페에서 따뜻한 차라도 마시는 행사를 열면 어떨까요?",
    voiceUrl: null,
    likes: 6,
    createdAt: new Date("2024-01-08"),
  },
  {
    id: "test-9",
    userId: "user-9",
    type: "text",
    content: "청년 창업을 돕는 지원책이 필요합니다. 지역에 청년이 적은 만큼, 같이 지역에서 성장하고 싶은 청년들과의 네트워킹이 절실합니다.",
    voiceUrl: null,
    likes: 5,
    createdAt: new Date("2024-01-09"),
  },
  {
    id: "test-10",
    userId: "user-10",
    type: "text",
    content: "빈집을 정비하고 주거 복지 사업에 활용하면 좋겠습니다.",
    voiceUrl: null,
    likes: 8,
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "test-11",
    userId: "user-11",
    type: "text",
    content: "가양문화센터 이번에 새로 생겨서 너무 좋은데 헬스장밖에 없어서 아쉽습니다. 탁구나 스쿼시 같은 실내 스포츠장이 생기면 좋겠어요.",
    voiceUrl: null,
    likes: 10,
    createdAt: new Date("2024-01-11"),
  },
  {
    id: "test-12",
    userId: "user-12",
    type: "text",
    content: "의사 분들이 지역까지 오기 쉽지 않다는 건 알지만, 면에도 공공병원이 생길 수만 있으면 마을 사람들이 건강 걱정을 조금 더 할 수 있을 텐데요ㅜㅜ 공공의료가 실현되길 바래봅니다",
    voiceUrl: null,
    likes: 13,
    createdAt: new Date("2024-01-12"),
  },
];

// ============================================================================
// Database Setup (only if not in test mode)
// ============================================================================

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (!TEST_MODE) {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = drizzle(pool, { schema });
}

// ============================================================================
// Schema Definitions (minimal, only what we need)
// ============================================================================

const opinions = schema.opinions;
const clusters = schema.clusters;
const opinionClusters = schema.opinionClusters;

// ============================================================================
// OpenAI Client
// ============================================================================

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required for clustering");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: textEmbeddingModel,
    input: text,
  });
  
  return response.data[0].embedding;
}

async function generateClusterTitle(opinions: Opinion[]): Promise<{ title: string; summary: string }> {
  const openai = getOpenAIClient();
  const opinionTexts = opinions.map((op, idx) => `${idx + 1}. ${op.content}`).join("\n");
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "당신은 시민 의견을 분석하여 핵심 주제를 파악하는 전문가입니다. 여러 의견을 읽고, 공통된 주제를 한 줄로 요약하고, 전체 내용을 2-3문장으로 요약해주세요.",
      },
      {
        role: "user",
        content: `다음 의견들의 공통 주제를 파악하여 JSON 형식으로 답변해주세요:\n\n${opinionTexts}\n\n응답 형식: {"title": "핵심 주제 (10자 이내)", "summary": "전체 요약 (2-3문장)"}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });
  
  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Failed to generate cluster title");
  }
  
  const result = JSON.parse(content);
  return {
    title: result.title || "의견 그룹",
    summary: result.summary || "여러 시민 의견의 모음",
  };
}

// ============================================================================
// Database Operations
// ============================================================================

async function getUnclusteredOpinions(): Promise<Opinion[]> {
  if (TEST_MODE) {
    console.log("[getUnclusteredOpinions] Using test data (TEST_MODE enabled)");
    console.log("[getUnclusteredOpinions] Test opinions:", TEST_OPINIONS.map(op => ({
      id: op.id,
      content: op.content.slice(0, 50) + "...",
      likes: op.likes,
    })));
    return TEST_OPINIONS;
  }

  if (!db) {
    throw new Error("Database not initialized");
  }

  console.log("[getUnclusteredOpinions] Fetching unclustered opinions from database");

  const result = await db
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
  
  console.log("[getUnclusteredOpinions] Result", {
    count: result.length,
    sample: result.slice(0, 5).map((op) => ({
      id: op.id,
      userId: op.userId,
      createdAt: op.createdAt,
    })),
  });
  return result;
}

async function createCluster(cluster: InsertCluster): Promise<Cluster> {
  if (TEST_MODE) {
    console.log("[createCluster] TEST_MODE: Would create cluster (not saving to DB):", cluster);
    // Return a mock cluster for test mode
    return {
      id: `test-cluster-${Date.now()}`,
      title: cluster.title,
      summary: cluster.summary,
      categoryId: cluster.agendaId,
      status: "pending",
      opinionCount: cluster.opinionCount,
      similarity: cluster.similarity,
      agendaId: cluster.agendaId,
      tags: null,
      createdAt: new Date(),
    };
  }

  if (!db) {
    throw new Error("Database not initialized");
  }

  const result = await db.insert(clusters).values(cluster).returning();
  return result[0];
}

async function createOpinionCluster(opinionCluster: InsertOpinionCluster): Promise<void> {
  if (TEST_MODE) {
    console.log("[createOpinionCluster] TEST_MODE: Would link opinion to cluster (not saving to DB):", opinionCluster);
    return;
  }

  if (!db) {
    throw new Error("Database not initialized");
  }

  await db.insert(opinionClusters).values(opinionCluster);
}

// ============================================================================
// Main Clustering Function
// ============================================================================

async function clusterOpinions(): Promise<{
  clustersCreated: number;
  opinionsProcessed: number;
}> {

  console.log("[clusterOpinions] Starting clustering job", {
    similarityThreshold,
    minClusterSize,
  });

  const unclusteredOpinions = await getUnclusteredOpinions();
  console.log("[clusterOpinions] Loaded unclustered opinions", {
    count: unclusteredOpinions.length,
    sampleIds: unclusteredOpinions.slice(0, 5).map((op) => op.id),
  });
  
  if (unclusteredOpinions.length < minClusterSize) {
    console.log("[clusterOpinions] Not enough unclustered opinions", {
      opinionsCount: unclusteredOpinions.length,
      minClusterSize,
    });
    return { clustersCreated: 0, opinionsProcessed: 0 };
  }
  
  console.log(`[clusterOpinions] Processing ${unclusteredOpinions.length} opinions for clustering...`);
  
  const opinionsWithEmbeddings: OpinionWithEmbedding[] = [];
  
  for (const opinion of unclusteredOpinions) {
    console.log("[clusterOpinions] Getting embedding for opinion", {
      opinionId: opinion.id,
      contentPreview: opinion.content.slice(0, 40),
    });
    const embedding = await getEmbedding(opinion.content);
    opinionsWithEmbeddings.push({ opinion, embedding });
  }

  console.log("[clusterOpinions] Embeddings generated", {
    opinionsWithEmbeddingsCount: opinionsWithEmbeddings.length,
  });
  
  const clusters: OpinionWithEmbedding[][] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < opinionsWithEmbeddings.length; i++) {
    if (processed.has(opinionsWithEmbeddings[i].opinion.id)) {
      continue;
    }
    
    const cluster: OpinionWithEmbedding[] = [opinionsWithEmbeddings[i]];
    processed.add(opinionsWithEmbeddings[i].opinion.id);
    
    for (let j = i + 1; j < opinionsWithEmbeddings.length; j++) {
      if (processed.has(opinionsWithEmbeddings[j].opinion.id)) {
        continue;
      }
      
      const similarity = cosineSimilarity(
        opinionsWithEmbeddings[i].embedding,
        opinionsWithEmbeddings[j].embedding
      );

      console.log("[clusterOpinions] Similarity between opinions", {
        opinion1Id: opinionsWithEmbeddings[i].opinion.id,
        opinion2Id: opinionsWithEmbeddings[j].opinion.id,
        similarity,
      });
      
      if (similarity >= similarityThreshold) {
        cluster.push(opinionsWithEmbeddings[j]);
        processed.add(opinionsWithEmbeddings[j].opinion.id);
      }
    }
    
    if (cluster.length >= minClusterSize) {
      clusters.push(cluster);
    }
  }
  
  console.log("[clusterOpinions] Clustering finished", {
    clustersCount: clusters.length,
    processedOpinionIds: Array.from(processed),
  });
  
  let clustersCreated = 0;
  let opinionsProcessed = 0;
  
  for (const cluster of clusters) {
    const clusterOpinions = cluster.map((c) => c.opinion);
    console.log("[clusterOpinions] Generating title for cluster", {
      opinionIds: clusterOpinions.map((op) => op.id),
    });
    
    const { title, summary } = await generateClusterTitle(clusterOpinions);
    
    const avgSimilarity = cluster.reduce((sum, item, idx) => {
      if (idx === 0) return 0;
      return sum + cosineSimilarity(cluster[0].embedding, item.embedding);
    }, 0) / Math.max(1, cluster.length - 1);
    
    const createdCluster = await createCluster({
      title,
      summary,
      opinionCount: cluster.length,
      similarity: Math.round(avgSimilarity * 100),
      agendaId: null,
    });
    
    console.log("\n" + "=".repeat(80));
    console.log("📦 CLUSTER CREATED:");
    console.log("=".repeat(80));
    console.log("Title:", title);
    console.log("Summary:", summary);
    console.log("Opinion Count:", cluster.length);
    console.log("Average Similarity:", Math.round(avgSimilarity * 100) + "%");
    console.log("\nOpinions in this cluster:");
    clusterOpinions.forEach((op, idx) => {
      console.log(`  ${idx + 1}. [${op.id}] ${op.content.slice(0, 60)}${op.content.length > 60 ? "..." : ""}`);
    });
    console.log("=".repeat(80) + "\n");
    
    for (const item of cluster) {
      await createOpinionCluster({
        opinionId: item.opinion.id,
        clusterId: createdCluster.id,
      });
    }
    
    clustersCreated++;
    opinionsProcessed += cluster.length;
  }
  
  return { clustersCreated, opinionsProcessed };
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  console.log("[run-clustering] Starting clustering script");
  console.log("[run-clustering] Mode:", TEST_MODE ? "🧪 TEST MODE" : "🚀 PRODUCTION MODE");
  console.log("[run-clustering] Environment check:", {
    testMode: TEST_MODE,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasOpenAIApiKey: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });

  // Validate required environment variables
  if (!TEST_MODE && !process.env.DATABASE_URL) {
    console.error("[run-clustering] ERROR: DATABASE_URL environment variable is required (unless TEST_MODE=true)");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("[run-clustering] ERROR: OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }

  if (TEST_MODE) {
    console.log("\n🧪 TEST MODE ENABLED");
    console.log("   - Using test data instead of database");
    console.log("   - Results will be printed to console only");
    console.log("   - No database writes will be performed\n");
  }

  try {
    const startTime = Date.now();
    console.log("[run-clustering] Executing clustering job...");

    const result = await clusterOpinions();

    const duration = Date.now() - startTime;
    console.log("\n" + "=".repeat(80));
    console.log("✅ CLUSTERING JOB COMPLETED");
    console.log("=".repeat(80));
    console.log("Clusters Created:", result.clustersCreated);
    console.log("Opinions Processed:", result.opinionsProcessed);
    console.log("Duration:", Math.round(duration / 1000) + "s (" + duration + "ms)");
    console.log("=".repeat(80) + "\n");

    // Close database connection (if not in test mode)
    if (!TEST_MODE && pool) {
      await pool.end();
      console.log("[run-clustering] Database connection closed");
    }

    // Exit with success
    process.exit(0);
  } catch (error) {
    console.error("[run-clustering] ERROR: Clustering job failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Close database connection on error (if not in test mode)
    if (!TEST_MODE && pool) {
      await pool.end().catch(() => {});
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("[run-clustering] FATAL ERROR:", error);
  process.exit(1);
});
