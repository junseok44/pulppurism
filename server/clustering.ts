import OpenAI from "openai";
import { storage } from "./storage";
import type { Opinion } from "@shared/schema";

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required for clustering");
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface OpinionWithEmbedding {
  opinion: Opinion;
  embedding: number[];
}

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
    model: "text-embedding-3-small",
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

export async function clusterOpinions(): Promise<{
  clustersCreated: number;
  opinionsProcessed: number;
}> {
  const similarityThreshold = 0.75;
  const minClusterSize = 2;
  
  const opinions = await storage.getUnclusteredOpinions();
  
  if (opinions.length < minClusterSize) {
    return { clustersCreated: 0, opinionsProcessed: 0 };
  }
  
  console.log(`Processing ${opinions.length} opinions for clustering...`);
  
  const opinionsWithEmbeddings: OpinionWithEmbedding[] = [];
  
  for (const opinion of opinions) {
    const embedding = await getEmbedding(opinion.content);
    opinionsWithEmbeddings.push({ opinion, embedding });
  }
  
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
      
      if (similarity >= similarityThreshold) {
        cluster.push(opinionsWithEmbeddings[j]);
        processed.add(opinionsWithEmbeddings[j].opinion.id);
      }
    }
    
    if (cluster.length >= minClusterSize) {
      clusters.push(cluster);
    }
  }
  
  console.log(`Found ${clusters.length} clusters`);
  
  let clustersCreated = 0;
  let opinionsProcessed = 0;
  
  for (const cluster of clusters) {
    const opinions = cluster.map(c => c.opinion);
    
    const { title, summary } = await generateClusterTitle(opinions);
    
    const avgSimilarity = cluster.reduce((sum, item, idx) => {
      if (idx === 0) return 0;
      return sum + cosineSimilarity(cluster[0].embedding, item.embedding);
    }, 0) / Math.max(1, cluster.length - 1);
    
    const createdCluster = await storage.createCluster({
      title,
      summary,
      opinionCount: cluster.length,
      similarity: Math.round(avgSimilarity * 100),
      agendaId: null,
    });
    
    for (const item of cluster) {
      await storage.createOpinionCluster({
        opinionId: item.opinion.id,
        clusterId: createdCluster.id,
      });
    }
    
    clustersCreated++;
    opinionsProcessed += cluster.length;
  }
  
  return { clustersCreated, opinionsProcessed };
}
