import { Router, Request, Response, NextFunction } from "express";
import { workerService } from "../services/worker.service";
import { logger } from "../../../shared/utils/logger";

const router = Router();

/**
 * @swagger
 * /worker/process:
 *   post:
 *     summary: Process analysis task (Cloud Tasks callback)
 *     description: Internal endpoint called by Cloud Tasks to process an analysis job
 *     tags: [Worker]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - analysis_id
 *             properties:
 *               analysis_id:
 *                 type: string
 *                 description: Analysis ID to process
 *     responses:
 *       200:
 *         description: Task processed successfully
 *       400:
 *         description: Missing analysis_id
 *       500:
 *         description: Processing failed
 */
router.post(
  "/process",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { analysis_id } = req.body;

      if (!analysis_id) {
        res.status(400).json({
          success: false,
          error: { message: "analysis_id is required" },
        });
        return;
      }

      // Log Cloud Tasks headers for debugging
      const taskName = req.headers["x-cloudtasks-taskname"];
      const queueName = req.headers["x-cloudtasks-queuename"];
      if (taskName) {
        logger.info(
          `Processing Cloud Task: ${taskName} from queue: ${queueName}`,
        );
      }

      // Process the analysis
      await workerService.processAnalysis(analysis_id);

      res.json({
        success: true,
        message: `Analysis ${analysis_id} processed`,
      });
    } catch (error) {
      logger.error("Worker processing failed:", error);
      // Return 500 so Cloud Tasks will retry
      res.status(500).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Processing failed",
        },
      });
    }
  },
);

export default router;
