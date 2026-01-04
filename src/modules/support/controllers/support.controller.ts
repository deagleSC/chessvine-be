import { Request, Response, NextFunction } from "express";
import { supportService } from "../services/support.service";
import { ApiResponse } from "../../../shared/types";
import { ContactTicketRequest } from "../types";
import { logger } from "../../../shared/utils/logger";

/**
 * @swagger
 * /api/v1/support/contact:
 *   post:
 *     summary: Submit a contact ticket
 *     tags: [Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               subject:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: "Question about features"
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 example: "I have a question about the AI analysis feature."
 *     responses:
 *       201:
 *         description: Contact ticket created successfully
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
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     subject:
 *                       type: string
 *                       example: "Question about features"
 *                     message:
 *                       type: string
 *                       example: "I have a question about the AI analysis feature."
 *                     status:
 *                       type: string
 *                       enum: [open, in_progress, resolved, closed]
 *                       example: "open"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
export const createContactTicket = async (
  req: Request<{}, ApiResponse, ContactTicketRequest>,
  res: Response<ApiResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const ticket = await supportService.createContactTicket(req.body);

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    logger.error("Error in createContactTicket controller:", error);
    next(error);
  }
};
