import { Router, Request, Response } from "express";
import {
  authenticate,
  requireVerifiedAccount,
  requireFundManager,
} from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validator.middleware";
import {
  AssetAppraisalSubmissionSchema,
  CustodyConfirmationSchema,
  TokenizationSchema,
  PrimarySubscriptionSchema,
} from "../../schemas/asset.schema";
import { assetService } from "../../services/asset.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requestContext } from "../../utils/requestContext";

const assetsRouter = Router();

assetsRouter.use(authenticate, requireVerifiedAccount);

assetsRouter.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const assets = await assetService.listAssets({
      lifecycle_status: req.query.lifecycle_status as string | undefined,
    });
    res.status(200).json({ success: true, data: assets });
  }),
);

assetsRouter.get(
  "/:assetId",
  asyncHandler(async (req: Request, res: Response) => {
    const asset = await assetService.getAsset(String(req.params.assetId));
    res.status(200).json({ success: true, data: asset });
  }),
);

// Primary subscription is an investor action, so it sits before the
// fund-manager guard below.
assetsRouter.post(
  "/sub-funds/:subFundId/subscribe",
  validateRequest(PrimarySubscriptionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await assetService.subscribePrimary(
      req.user!.userId,
      String(req.params.subFundId),
      req.body,
      requestContext(req),
    );
    res.status(201).json({
      success: true,
      message: "Subscription settled.",
      data: result,
    });
  }),
);

assetsRouter.use(requireFundManager);

assetsRouter.post(
  "/",
  validateRequest(AssetAppraisalSubmissionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await assetService.submitAppraisal(
      req.user!.userId,
      req.body,
      requestContext(req),
    );
    res.status(201).json({
      success: true,
      message: "Asset registered with its independent appraisal.",
      data: result,
    });
  }),
);

assetsRouter.post(
  "/:assetId/custody",
  validateRequest(CustodyConfirmationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await assetService.confirmCustody(
      req.user!.userId,
      String(req.params.assetId),
      req.body,
      requestContext(req),
    );
    res.status(201).json({
      success: true,
      message: "Custody confirmed by the custodian bank.",
      data: result,
    });
  }),
);

assetsRouter.post(
  "/:assetId/tokenize",
  validateRequest(TokenizationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await assetService.tokenize(
      req.user!.userId,
      String(req.params.assetId),
      req.body,
      requestContext(req),
    );
    res.status(201).json({
      success: true,
      message: "Sub-fund minted and shares allocated.",
      data: result,
    });
  }),
);

export { assetsRouter };
