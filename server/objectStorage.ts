import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Response } from "express";
import { Readable } from "stream";

// S3 클라이언트 생성
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || S3_BUCKET_NAME;
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS or S3_BUCKET_NAME not set. " +
          "Set S3_BUCKET_NAME env var with your S3 bucket name."
      );
    }
    return paths;
  }

  async searchPublicObject(filePath: string): Promise<{ bucket: string; key: string } | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const bucketName = searchPath.startsWith("/") ? searchPath.slice(1) : searchPath;
      const key = filePath.startsWith("/") ? filePath.slice(1) : filePath;

      try {
        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        await s3Client.send(command);
        return { bucket: bucketName, key };
      } catch (error: unknown) {
        const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
        if (err.name !== "NotFound" && err.$metadata?.httpStatusCode !== 404) {
          console.error("Error checking object:", error);
        }
      }
    }

    return null;
  }

  async downloadObject(
    bucket: string,
    key: string,
    res: Response,
    cacheTtlSec: number = 3600
  ) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await s3Client.send(command);

      res.set({
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Length": response.ContentLength?.toString() || "0",
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      // AWS SDK v3의 Body는 ReadableStream 또는 Blob일 수 있음
      if (response.Body) {
        // ReadableStream을 Node.js Readable로 변환
        if (response.Body instanceof Readable) {
          response.Body.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Error streaming file" });
            }
          });
          response.Body.pipe(res);
        } else {
          // Blob이나 다른 타입인 경우
          const stream = Readable.fromWeb(response.Body as any);
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Error streaming file" });
            }
          });
          stream.pipe(res);
        }
      } else {
        throw new Error("Invalid response body type");
      }
    } catch (error: any) {
      console.error("Error downloading file:", error);
      if (error.name === "NoSuchKey" || error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        if (!res.headersSent) {
          res.status(404).json({ error: "File not found" });
        }
      } else {
        if (!res.headersSent) {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }

  async uploadFile(filePath: string, buffer: Buffer): Promise<string> {
    const searchPaths = this.getPublicObjectSearchPaths();
    if (searchPaths.length === 0) {
      throw new Error("No public object search paths configured");
    }

    const bucketName = searchPaths[0].startsWith("/") 
      ? searchPaths[0].slice(1) 
      : searchPaths[0];
    const key = filePath.startsWith("/") ? filePath.slice(1) : filePath;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: getContentType(filePath),
    });

    await s3Client.send(command);

    return `/${bucketName}/${key}`;
  }
}


function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'csv': 'text/csv',
  };
  return types[ext || ''] || 'application/octet-stream';
}
