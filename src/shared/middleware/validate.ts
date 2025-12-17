import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type ValidationSource = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: ValidationSource = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req[source]);
      req[source] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message).join(", ");
        res.status(400).json({
          success: false,
          error: { message: messages },
        });
        return;
      }
      next(error);
    }
  };
}
