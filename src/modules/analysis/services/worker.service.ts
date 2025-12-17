import { Analysis } from "../models/analysis.model";
import { AnalysisStatus, PlayerColor } from "../types";
import { geminiService } from "./gemini.service";
import { logger } from "../../../shared/utils/logger";

/**
 * Process a single analysis job
 */
export async function processAnalysis(analysisId: string): Promise<void> {
  logger.info(`Processing analysis: ${analysisId}`);

  const analysis = await Analysis.findOne({ analysis_id: analysisId });

  if (!analysis) {
    logger.error(`Analysis not found: ${analysisId}`);
    return;
  }

  if (analysis.status !== AnalysisStatus.PENDING) {
    logger.info(`Analysis ${analysisId} already processed, skipping`);
    return;
  }

  try {
    // Update status to PROCESSING
    analysis.status = AnalysisStatus.PROCESSING;
    await analysis.save();

    // Run Gemini analysis with player context
    const result = await geminiService.analyzeGame(
      analysis.pgn,
      {
        white: analysis.metadata.white,
        black: analysis.metadata.black,
        result: analysis.metadata.result,
        event: analysis.metadata.event || "",
        date: analysis.metadata.date || "",
      },
      analysis.player_name,
      analysis.player_color as PlayerColor,
    );

    // Update with results
    analysis.result = result;
    analysis.status = AnalysisStatus.COMPLETED;
    analysis.completed_at = new Date();
    await analysis.save();

    logger.info(`Analysis completed: ${analysisId}`);
  } catch (error) {
    logger.error(`Analysis failed: ${analysisId}`, error);

    analysis.status = AnalysisStatus.FAILED;
    analysis.error = error instanceof Error ? error.message : "Unknown error";
    await analysis.save();
  }
}

export const workerService = {
  processAnalysis,
};
