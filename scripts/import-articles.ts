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
import { eq } from "drizzle-orm";

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

    // Validate data before deletion
    const validationErrors: string[] = [];
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      if (!article["게시물 내용"]) {
        validationErrors.push(`Article ${i + 1}: Missing content`);
      }
    }

    if (validationErrors.length > 0) {
      console.error("Validation errors:");
      validationErrors.forEach((err) => console.error(`  - ${err}`));
      throw new Error("Validation failed");
    }

    let importedOpinions = 0;
    let importedComments = 0;
    let skippedArticles = 0;
    const userCache = new Map<string, string>(); // username -> userId

    // Use transaction for safe deletion and import
    await db.transaction(async (tx) => {
      console.log("Deleting existing data...");

      // Step 1: Delete existing data in correct order
      await tx.delete(opinionClusters);
      await tx.delete(agendaBookmarks);
      await tx.delete(clusters);
      await tx.delete(dbComments);
      await tx.delete(opinionLikes);
      await tx.delete(opinions);

      console.log("Existing data deleted. Starting import...");

      // Step 2: Process each article
      for (const article of articles) {
        try {
          // Get or create author user
          const authorUsername = article["게시물 작성자"] || "익명";
          let authorUserId = userCache.get(authorUsername);

          if (!authorUserId) {
            // Check if user exists
            const [existingUser] = await tx
              .select()
              .from(users)
              .where(eq(users.username, authorUsername))
              .limit(1);

            if (existingUser) {
              authorUserId = existingUser.id;
            } else {
              // Create new user
              const [newUser] = await tx
                .insert(users)
                .values({
                  username: authorUsername,
                  displayName: authorUsername,
                  provider: "local",
                })
                .returning();
              authorUserId = newUser.id;
            }
            userCache.set(authorUsername, authorUserId);
          }

          // Create opinion from article
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

          // Step 3: Process comments
          const comments = article["댓글"] || [];
          for (const comment of comments) {
            try {
              const commentAuthorUsername = comment["댓글 작성자"] || "익명";
              let commentAuthorId = userCache.get(commentAuthorUsername);

              if (!commentAuthorId) {
                const [existingUser] = await tx
                  .select()
                  .from(users)
                  .where(eq(users.username, commentAuthorUsername))
                  .limit(1);

                if (existingUser) {
                  commentAuthorId = existingUser.id;
                } else {
                  const [newUser] = await tx
                    .insert(users)
                    .values({
                      username: commentAuthorUsername,
                      displayName: commentAuthorUsername,
                      provider: "local",
                    })
                    .returning();
                  commentAuthorId = newUser.id;
                }
                userCache.set(commentAuthorUsername, commentAuthorId);
              }

              const commentCreatedAt = parseKoreanDateTime(
                comment["댓글 작성 일시"]
              );

              await tx.insert(dbComments).values({
                opinionId: newOpinion.id,
                userId: commentAuthorId,
                content: comment["댓글 내용"] || "",
                likes: comment["댓글 좋아요"] || 0,
                createdAt: commentCreatedAt,
              });

              importedComments++;
            } catch (commentError) {
              console.error(`Failed to import comment:`, commentError);
              // Continue with other comments
            }
          }
        } catch (articleError) {
          console.error(`Failed to import article:`, articleError);
          skippedArticles++;
          // Continue with other articles
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
