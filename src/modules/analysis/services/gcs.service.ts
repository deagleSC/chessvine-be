import { Storage, Bucket } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../../../shared/utils/logger";

let storage: Storage;
let bucket: Bucket;

function getBucketName(): string {
  const name = process.env.GCP_STORAGE_BUCKET;
  if (!name) {
    throw new Error("GCP_STORAGE_BUCKET environment variable is not set");
  }
  return name;
}

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }
  return storage;
}

function getBucket(): Bucket {
  if (!bucket) {
    bucket = getStorage().bucket(getBucketName());
  }
  return bucket;
}

/**
 * Upload a file buffer to GCS
 */
export async function uploadFile(
  fileBuffer: Buffer,
  originalName: string,
  userId: string,
): Promise<string> {
  const fileName = `uploads/${userId}/${uuidv4()}-${originalName}`;
  const file = getBucket().file(fileName);

  await file.save(fileBuffer, {
    contentType: "text/plain",
    metadata: {
      originalName,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
    },
  });

  const gcsUrl = `gs://${getBucketName()}/${fileName}`;
  logger.info(`File uploaded to GCS: ${gcsUrl}`);

  return gcsUrl;
}

/**
 * Upload multiple files to GCS
 */
export async function uploadFiles(
  files: { buffer: Buffer; originalname: string }[],
  userId: string,
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadFile(file.buffer, file.originalname, userId),
  );

  return Promise.all(uploadPromises);
}

/**
 * Download file content from GCS URL
 */
export async function downloadFile(gcsUrl: string): Promise<string> {
  // Parse gs://bucket-name/path/to/file format
  const match = gcsUrl.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid GCS URL format: ${gcsUrl}`);
  }

  const [, bucketName, filePath] = match;
  const file = getStorage().bucket(bucketName).file(filePath);

  const [content] = await file.download();
  return content.toString("utf-8");
}

export const gcsService = {
  uploadFile,
  uploadFiles,
  downloadFile,
};
