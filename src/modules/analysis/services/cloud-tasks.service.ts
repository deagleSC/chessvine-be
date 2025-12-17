import { CloudTasksClient } from "@google-cloud/tasks";
import { logger } from "../../../shared/utils/logger";

let client: CloudTasksClient;

function getClient(): CloudTasksClient {
  if (!client) {
    client = new CloudTasksClient();
  }
  return client;
}

function getQueuePath(): string {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_TASKS_LOCATION || "us-central1";
  const queue = process.env.GCP_TASKS_QUEUE || "analysis-queue";

  if (!projectId) {
    throw new Error("GCP_PROJECT_ID environment variable is not set");
  }

  return getClient().queuePath(projectId, location, queue);
}

function getWorkerUrl(): string {
  const url = process.env.GCP_CLOUD_RUN_URL;
  if (!url) {
    throw new Error("GCP_CLOUD_RUN_URL environment variable is not set");
  }
  return `${url}/worker/process`;
}

/**
 * Enqueue a single analysis task to Cloud Tasks
 */
export async function enqueueAnalysis(analysisId: string): Promise<void> {
  const queuePath = getQueuePath();
  const workerUrl = getWorkerUrl();

  const task = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: workerUrl,
      headers: {
        "Content-Type": "application/json",
      },
      body: Buffer.from(JSON.stringify({ analysis_id: analysisId })).toString(
        "base64",
      ),
    },
  };

  try {
    const [response] = await getClient().createTask({
      parent: queuePath,
      task,
    });

    logger.info(`Task created: ${response.name} for analysis ${analysisId}`);
  } catch (error) {
    logger.error(`Failed to enqueue task for ${analysisId}:`, error);
    throw error;
  }
}

/**
 * Enqueue multiple analysis tasks
 */
export async function enqueueAnalysisBatch(
  analysisIds: string[],
): Promise<void> {
  for (const id of analysisIds) {
    await enqueueAnalysis(id);
  }
}

export const cloudTasksService = {
  enqueueAnalysis,
  enqueueAnalysisBatch,
};
