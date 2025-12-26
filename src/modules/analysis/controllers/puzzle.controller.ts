import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../auth/middleware/auth.middleware";
import { puzzleService } from "../services/puzzle.service";
import { ApiResponse } from "../../../shared/types";

/**
 * @swagger
 * /api/v1/puzzles:
 *   get:
 *     summary: Get all puzzles for the authenticated user
 *     description: Returns all chess puzzles generated from the user's game analyses
 *     tags: [Puzzles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Puzzles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       puzzle_id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       fen:
 *                         type: string
 *                       solution:
 *                         type: string
 *                       hint:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                         enum: [easy, medium, hard]
 *                       theme:
 *                         type: string
 *                       analysis_id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 */
export async function getUserPuzzles(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      } as ApiResponse);
      return;
    }

    const puzzles = await puzzleService.getUserPuzzles(req.user.id);

    res.json({
      success: true,
      data: puzzles.map((puzzle) => ({
        puzzle_id: puzzle.puzzle_id,
        title: puzzle.title,
        description: puzzle.description,
        fen: puzzle.fen,
        solution: puzzle.solution,
        hint: puzzle.hint,
        difficulty: puzzle.difficulty,
        theme: puzzle.theme,
        analysis_id: puzzle.analysis_id,
        created_at: puzzle.created_at,
        updated_at: puzzle.updated_at,
      })),
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
}

/**
 * @swagger
 * /api/v1/puzzles/analysis/{analysisId}:
 *   get:
 *     summary: Get all puzzles for a specific analysis
 *     description: Returns all chess puzzles generated from a specific game analysis for the authenticated user
 *     tags: [Puzzles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *         description: Analysis ID
 *         example: "ana_550e8400-e29b-41d4-a716-446655440001"
 *     responses:
 *       200:
 *         description: Puzzles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       puzzle_id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       fen:
 *                         type: string
 *                       solution:
 *                         type: string
 *                       hint:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                         enum: [easy, medium, hard]
 *                       theme:
 *                         type: string
 *                       analysis_id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       404:
 *         description: Analysis not found or no puzzles available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 */
export async function getPuzzlesByAnalysisId(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      } as ApiResponse);
      return;
    }

    const { analysisId } = req.params;

    if (!analysisId) {
      res.status(400).json({
        success: false,
        error: { message: "Analysis ID is required" },
      } as ApiResponse);
      return;
    }

    const puzzles = await puzzleService.getPuzzlesByAnalysisId(
      req.user.id,
      analysisId,
    );

    res.json({
      success: true,
      data: puzzles.map((puzzle) => ({
        puzzle_id: puzzle.puzzle_id,
        title: puzzle.title,
        description: puzzle.description,
        fen: puzzle.fen,
        solution: puzzle.solution,
        hint: puzzle.hint,
        difficulty: puzzle.difficulty,
        theme: puzzle.theme,
        analysis_id: puzzle.analysis_id,
        created_at: puzzle.created_at,
        updated_at: puzzle.updated_at,
      })),
    } as ApiResponse);
  } catch (error) {
    next(error);
  }
}
