import { db, pool } from "./db";
import { categories } from "@shared/schema";

const defaultCategories = [
  { name: "교육", type: "education" as const, description: "학교, 교육 시설, 교육 정책 등" },
  { name: "교통", type: "transportation" as const, description: "대중교통, 도로, 주차, 교통 안전 등" },
  { name: "환경", type: "environment" as const, description: "환경 보호, 쓰레기 처리, 공원 관리 등" },
  { name: "안전", type: "safety" as const, description: "치안, 재난 대비, 안전 시설 등" },
  { name: "복지", type: "welfare" as const, description: "사회 복지, 노인/장애인 지원 등" },
  { name: "문화", type: "culture" as const, description: "문화 시설, 행사, 여가 활동 등" },
  { name: "경제", type: "economy" as const, description: "지역 경제, 일자리, 상권 활성화 등" },
  { name: "보건", type: "health" as const, description: "보건소, 의료 시설, 건강 정책 등" },
  { name: "주거", type: "housing" as const, description: "주택, 재개발, 주거 환경 개선 등" },
  { name: "행정", type: "administration" as const, description: "행정 서비스, 민원 처리 등" },
  { name: "기타", type: "other" as const, description: "기타 주민 의견" },
];

export async function seedDatabase() {
  console.log("Starting database seed...");

  try {
    const existingCategories = await db.select().from(categories);
    
    if (existingCategories.length > 0) {
      console.log(`Categories already exist (${existingCategories.length} found). Skipping seed.`);
      return;
    }

    for (const category of defaultCategories) {
      await db.insert(categories).values(category);
    }

    console.log("Database seeded successfully with 11 categories.");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase().catch(console.error);
