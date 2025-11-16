import { readFileSync } from "fs";
import { resolve } from "path";
import { db } from "../server/db";
import {
  opinions,
  users,
  comments as dbComments,
  opinionLikes,
  opinionClusters,
  clusters,
  agendaBookmarks,
} from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

function parseKoreanDateTime(dateStr: string): Date {
  if (!dateStr) return new Date();

  // Format: "2025-11-08 19:55:53" -> ISO format
  const isoFormat = dateStr.replace(" ", "T");
  const parsed = new Date(isoFormat);

  // Check if date is valid
  if (isNaN(parsed.getTime())) {
    console.warn(`Invalid date format: ${dateStr}, using current date`);
    return new Date();
  }

  return parsed;
}

async function importArticles() {
  try {
    // Read JSON file from command line argument or default path
    const filePath = process.argv[2] || "./articles.json";
    const absolutePath = resolve(filePath);

    console.log(`Reading file: ${absolutePath}`);
    const fileContent = readFileSync(absolutePath, "utf-8");
    const articles = JSON.parse(fileContent);

    if (!Array.isArray(articles)) {
      throw new Error("JSON file must contain an array of articles");
    }

    console.log(`Found ${articles.length} articles to import`);

    // Filter out invalid articles before processing
    const validArticles = articles.filter((article, index) => {
      if (!article) {
        console.warn(`⚠️  Skipping article ${index + 1}: null or undefined`);
        return false;
      }
      if (!article["게시물 내용"]) {
        console.warn(`⚠️  Skipping article ${index + 1}: Missing content`);
        return false;
      }
      return true;
    });

    // Remove duplicates based on content
    const seenContent = new Set<string>();
    const uniqueArticles = validArticles.filter((article) => {
      const content = article["게시물 내용"];
      if (seenContent.has(content)) {
        return false; // Skip duplicate
      }
      seenContent.add(content);
      return true;
    });

    const duplicateCount = validArticles.length - uniqueArticles.length;
    console.log(`Valid articles to import: ${validArticles.length} out of ${articles.length}`);
    if (duplicateCount > 0) {
      console.log(`⚠️  Removed ${duplicateCount} duplicate articles`);
    }
    console.log(`Unique articles to import: ${uniqueArticles.length}`);

    // Step 1: Collect all unique usernames
    console.log("Collecting unique usernames...");
    const allUsernames = new Set<string>();
    for (const article of uniqueArticles) {
      allUsernames.add(article["게시물 작성자"] || "익명");
      const comments = article["댓글"] || [];
      for (const comment of comments) {
        allUsernames.add(comment["댓글 작성자"] || "익명");
      }
    }
    console.log(`Found ${allUsernames.size} unique users`);

    let importedOpinions = 0;
    let importedComments = 0;
    let skippedArticles = 0;

    // Use transaction for safe deletion and import
    await db.transaction(async (tx) => {
      console.log("Deleting existing data...");

      // Delete existing data in correct order
      await tx.delete(opinionClusters);
      await tx.delete(agendaBookmarks);
      await tx.delete(clusters);
      await tx.delete(dbComments);
      await tx.delete(opinionLikes);
      await tx.delete(opinions);

      console.log("Existing data deleted.");

      // Step 2: Fetch all existing users at once
      console.log("Fetching existing users...");
      const existingUsers = await tx
        .select()
        .from(users)
        .where(inArray(users.username, Array.from(allUsernames)));

      const userCache = new Map<string, string>();
      for (const user of existingUsers) {
        userCache.set(user.username, user.id);
      }
      console.log(`Found ${existingUsers.length} existing users`);

      // Step 3: Create missing users in batch
      const missingUsernames = Array.from(allUsernames).filter(
        (username) => !userCache.has(username)
      );
      
      if (missingUsernames.length > 0) {
        console.log(`Creating ${missingUsernames.length} new users...`);
        const newUsers = await tx
          .insert(users)
          .values(
            missingUsernames.map((username) => ({
              username,
              displayName: username,
              provider: "local" as const,
            }))
          )
          .returning();

        for (const user of newUsers) {
          userCache.set(user.username, user.id);
        }
        console.log(`Created ${newUsers.length} new users`);
      }

      console.log("Starting import...");

      // Step 4: Process articles
      let processedCount = 0;
      for (const article of uniqueArticles) {
        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`Processing article ${processedCount}/${uniqueArticles.length}...`);
        }

        try {
          const authorUsername = article["게시물 작성자"] || "익명";
          const authorUserId = userCache.get(authorUsername)!;

          const opinionContent = article["게시물 내용"] || "";
          const createdAt = parseKoreanDateTime(article["게시물 작성 일시"]);

          const [newOpinion] = await tx
            .insert(opinions)
            .values({
              userId: authorUserId,
              content: opinionContent,
              createdAt: createdAt,
            })
            .returning();

          importedOpinions++;

          // Process comments
          const comments = article["댓글"] || [];
          if (comments.length > 0) {
            const commentValues = comments
              .map((comment) => {
                const commentAuthorUsername = comment["댓글 작성자"] || "익명";
                const commentAuthorId = userCache.get(commentAuthorUsername);
                
                if (!commentAuthorId) {
                  console.warn(`Missing user for comment: ${commentAuthorUsername}`);
                  return null;
                }

                return {
                  opinionId: newOpinion.id,
                  userId: commentAuthorId,
                  content: comment["댓글 내용"] || "",
                  likes: comment["댓글 좋아요"] || 0,
                  createdAt: parseKoreanDateTime(comment["댓글 작성 일시"]),
                };
              })
              .filter((c): c is NonNullable<typeof c> => c !== null);

            if (commentValues.length > 0) {
              await tx.insert(dbComments).values(commentValues);
              importedComments += commentValues.length;
            }
          }
        } catch (articleError) {
          console.error(`Failed to import article ${processedCount}:`, articleError);
          skippedArticles++;
        }
      }
    });

    console.log("\n✅ Import completed successfully!");
    console.log(`📝 Imported opinions: ${importedOpinions}`);
    console.log(`💬 Imported comments: ${importedComments}`);
    if (skippedArticles > 0) {
      console.log(`⚠️  Skipped articles: ${skippedArticles}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Import failed:");
    console.error(error);
    process.exit(1);
  }
}

importArticles();
