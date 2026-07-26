import { Router, Request, Response } from "express";
import {
  authenticate,
  requireVerifiedAccount,
} from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validator.middleware";
import {
  fundingService,
  FundingSourceRequestSchema,
} from "../../services/funding.service";
import { asyncHandler } from "../../utils/asyncHandler";

const fundingRouter = Router();

fundingRouter.use(authenticate, requireVerifiedAccount);

fundingRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const sources = await fundingService.list(req.user!.userId);
    res.status(200).json({ success: true, data: sources });
  }),
);

fundingRouter.post(
  "/",
  validateRequest(FundingSourceRequestSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const source = await fundingService.link(req.user!.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Funding source linked.",
      data: source,
    });
  }),
);

export { fundingRouter };
