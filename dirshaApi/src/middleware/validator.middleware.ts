import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

function formatIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Validates and replaces req.body with the parsed result.
 *
 * Parsing (rather than merely checking) matters here: Zod strips fields the
 * schema does not declare, so a caller cannot smuggle extra columns such as
 * account_status into an insert.
 */
export const validateRequest = (schema: ZodType) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body ?? {});
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          code: "VALIDATION_FAILED",
          message: "Some of the submitted values are invalid.",
          errors: formatIssues(error),
        });
        return;
      }
      next(error);
    }
  };
};

/** Same contract as validateRequest, for querystring parameters. */
export const validateQuery = (schema: ZodType) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query ?? {});
      // req.query is a getter-only property on Express 5, so the parsed values
      // are exposed separately instead of being assigned back.
      (req as any).validatedQuery = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          code: "VALIDATION_FAILED",
          message: "Some of the submitted query parameters are invalid.",
          errors: formatIssues(error),
        });
        return;
      }
      next(error);
    }
  };
};
