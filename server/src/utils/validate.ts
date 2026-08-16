import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/** Express middleware factory: validates req.body against a Zod schema, or responds 400 with details. */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid request.",
        details: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
