import { logger } from "../../../shared/utils/logger";
import { workerService } from "./worker.service";
import { cloudTasksService } from "./cloud-tasks.service";

interface QueueService {
  enqueue(analysisId: string): Promise<void>;
  enqueueBatch(analysisIds: string[]): Promise<void>;
}

/**
 * Mock queue service for local development
 * Processes jobs asynchronously in the background
 */
class MockQueueService implements QueueService {
  async enqueue(analysisId: string): Promise<void> {
    logger.info(`[MockQueue] Enqueued analysis: ${analysisId}`);
    // Process asynchronously (don't await - fire and forget)
    setImmediate(() => {
      workerService.processAnalysis(analysisId).catch((err) => {
        logger.error(`[MockQueue] Failed to process ${analysisId}:`, err);
      });
    });
  }

  async enqueueBatch(analysisIds: string[]): Promise<void> {
    logger.info(`[MockQueue] Enqueued batch of ${analysisIds.length} analyses`);
    for (const id of analysisIds) {
      await this.enqueue(id);
    }
  }
}

/**
 * Cloud Tasks queue service for production
 * Enqueues tasks to Google Cloud Tasks
 */
class CloudTasksQueueService implements QueueService {
  async enqueue(analysisId: string): Promise<void> {
    logger.info(`[CloudTasks] Enqueuing analysis: ${analysisId}`);
    await cloudTasksService.enqueueAnalysis(analysisId);
  }

  async enqueueBatch(analysisIds: string[]): Promise<void> {
    logger.info(
      `[CloudTasks] Enqueuing batch of ${analysisIds.length} analyses`,
    );
    await cloudTasksService.enqueueAnalysisBatch(analysisIds);
  }
}

// Lazy initialization to ensure env vars are loaded
let _queueService: QueueService;

function getQueueService(): QueueService {
  if (!_queueService) {
    const useMockQueue = process.env.USE_MOCK_QUEUE === "true";
    _queueService = useMockQueue
      ? new MockQueueService()
      : new CloudTasksQueueService();
    logger.info(
      `Queue service initialized: ${useMockQueue ? "Mock" : "CloudTasks"}`,
    );
  }
  return _queueService;
}

export const queueService: QueueService = {
  enqueue: (id) => getQueueService().enqueue(id),
  enqueueBatch: (ids) => getQueueService().enqueueBatch(ids),
};
