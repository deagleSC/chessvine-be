import { Router } from "express";
import {
  getUserPuzzles,
  getPuzzlesByAnalysisId,
} from "../controllers/puzzle.controller";
import { requireAuth } from "../../auth/middleware/auth.middleware";

const router = Router();

// All puzzle routes require authentication
router.get("/", requireAuth, getUserPuzzles);
router.get("/analysis/:analysisId", requireAuth, getPuzzlesByAnalysisId);

export default router;
