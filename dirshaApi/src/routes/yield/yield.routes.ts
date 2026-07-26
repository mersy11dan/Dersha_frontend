import { Router, Request, Response } from "express";
import {
  authenticate,
  requireVerifiedAccount,
  requireFundManager,
} from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validator.middleware";
import {
  TradingHaltSchema,
  YieldDistributionSchema,
} from "../../schemas/yield.schema";
import { yieldService } from "../../services/yield.service";
import { reconciliationService } from "../../services/reconciliation.service";
import { runReconciliationNow } from "../../jobs/reconciliation.job";
import { asyncHandler } from "../../utils/asyncHandler";
import { requestContext } from "../../utils/requestContext";
import { ApiError } from "../../utils/ApiError";

const yieldRouter = Router();
const adminRouter = Router();

yieldRouter.use(authenticate, requireVerifiedAccount);
adminRouter.use(authenticate, requireVerifiedAccount);

// --- Investor-facing -------------------------------------------------------

yieldRouter.get(
  "/income",
  asyncHandler(async (req: Request, res: Response) => {
    const income = await yieldService.investorIncome(req.user!.userId);
    res.status(200).json({ success: true, data: income });
  }),
);

yieldRouter.get(
  "/distributions/:distributionId",
  asyncHandler(async (req: Request, res: Response) => {
    const distribution = await yieldService.describeDistribution(
      String(req.params.distributionId),
    );
    res.status(200).json({ success: true, data: distribution });
  }),
);

yieldRouter.get(
  "/sub-funds/:subFundId/distributions",
  asyncHandler(async (req: Request, res: Response) => {
    const distributions = await yieldService.listDistributions(
      String(req.params.subFundId),
    );
    res.status(200).json({ success: true, data: distributions });
  }),
);

// --- Fund manager ----------------------------------------------------------

yieldRouter.post(
  "/sub-funds/:subFundId/distributions",
  requireFundManager,
  validateRequest(YieldDistributionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const distribution = await yieldService.distribute(
      String(req.params.subFundId),
      req.user!.userId,
      req.body,
      requestContext(req),
    );
    res.status(201).json({
      success: true,
      message: `Yield distributed to ${distribution.recipient_count} investor(s), net of withholding tax.`,
      data: distribution,
    });
  }),
);

// --- Reconciliation and the kill switch ------------------------------------

adminRouter.get(
  "/trading-status",
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: await reconciliationService.getHaltState(),
    });
  }),
);

adminRouter.use(requireFundManager);

adminRouter.get(
  "/reconciliation",
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: await reconciliationService.listRuns(),
    });
  }),
);

adminRouter.post(
  "/reconciliation/run",
  asyncHandler(async (req: Request, res: Response) => {
    const report = await reconciliationService.run({
      triggeredBy: req.user!.userId,
    });
    res.status(200).json({
      success: true,
      message:
        report.status === "BALANCED"
          ? "Books reconciled; no unresolved exceptions."
          : `${report.unmatched_count} unresolved exception(s) recorded.`,
      data: report,
    });
  }),
);

adminRouter.get(
  "/reconciliation/:runId",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: await reconciliationService.describeRun(String(req.params.runId)),
    });
  }),
);

adminRouter.post(
  "/trading-halt",
  validateRequest(TradingHaltSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.body.halted && !req.body.reason) {
      throw ApiError.badRequest(
        "REASON_REQUIRED",
        "Give a reason when halting trading; it is shown to every investor.",
      );
    }

    const state = await reconciliationService.setHalt(
      req.body.halted,
      req.body.reason ?? "",
      "",
      req.user!.userId,
    );

    res.status(200).json({
      success: true,
      message: state.halted ? "Trading halted." : "Trading resumed.",
      data: state,
    });
  }),
);

export { yieldRouter, adminRouter };

// Exposed so an operator can force a run from a script without HTTP.
export { runReconciliationNow };
