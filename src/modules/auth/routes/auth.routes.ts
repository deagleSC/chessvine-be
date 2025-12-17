import { Router } from "express";
import {
  signup,
  login,
  googleAuth,
  refresh,
  getMe,
} from "../controllers/auth.controller";
import { validate } from "../../../shared/middleware/validate";
import {
  signupSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
} from "../validators/auth.validator";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleAuthSchema), googleAuth);
router.post("/refresh", validate(refreshTokenSchema), refresh);

// Protected routes
router.get("/me", requireAuth, getMe);

export default router;
