import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../../../shared/types";
import { AuthResponse } from "../types";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "Password123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         description: Validation error or user exists
 */
export async function signup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.signup(req.body);

    res.status(201).json({
      success: true,
      data: result,
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      res.status(400).json({
        success: false,
        error: { message: error.message },
      });
      return;
    }
    next(error);
  }
}

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      data: result,
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      res.status(401).json({
        success: false,
        error: { message: error.message },
      });
      return;
    }
    next(error);
  }
}

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     summary: Authenticate with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google ID token from client-side sign-in
 *     responses:
 *       200:
 *         description: Google authentication successful
 *       401:
 *         description: Invalid Google token
 */
export async function googleAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { credential } = req.body;
    const result = await authService.googleAuth(credential);

    res.json({
      success: true,
      data: result,
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid")) {
      res.status(401).json({
        success: false,
        error: { message: error.message },
      });
      return;
    }
    next(error);
  }
}

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: result,
    } as ApiResponse<AuthResponse>);
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: "Invalid or expired refresh token" },
    });
  }
}

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Not authenticated
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: "Not authenticated" },
      });
      return;
    }

    const user = await authService.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { message: "User not found" },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id!.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: user.provider,
      },
    });
  } catch (error) {
    next(error);
  }
}
