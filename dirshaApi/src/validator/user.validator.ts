// import { Request, Response, NextFunction } from "express";
// import { AnyZodObject, ZodError } from "zod";

// export const validateRequest = (schema: AnyZodObject) => {
//   return async (
//     req: Request,
//     res: Response,
//     next: NextFunction,
//   ): Promise<void> => {
//     try {
//       // Parse requests against our rules; strips unlisted/malicious payload fields
//       const parsed = await schema.parseAsync({
//         body: req.body,
//         query: req.query,
//         params: req.params,
//       });

//       req.body = parsed.body;
//       return next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         // Map clean, human-readable errors back to our frontend components
//         res.status(400).json({
//           status: "VALIDATION_FAILED",
//           errors: error.errors.map((err) => ({
//             field: err.path.join("."),
//             message: err.message,
//           })),
//         });
//         return;
//       }
//       res
//         .status(500)
//         .json({
//           status: "ERROR",
//           message: "Internal server validation failure",
//         });
//       return;
//     }
//   };
// };
