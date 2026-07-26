import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { userAuthService } from "../../../services/auth.service";
import { kycService } from "../../../services/kyc.service";
import { requestContext } from "../../../utils/requestContext";
import { ApiError } from "../../../utils/ApiError";

export const accountTempRegistrationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await userAuthService.registerTempUser(
      req.body,
      requestContext(req),
    );

    res.status(201).json({
      success: true,
      message:
        "Step 1 of onboarding complete. Your account is registered as PENDING_KYC.",
      data: {
        token: result.token,
        user: result.user,
        nextStage: "IDENTITY_VERIFICATION",
      },
    });
  },
);

export const verifyFaydaController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized("NOT_AUTHENTICATED", "Authentication required.");
    }

    const result = await kycService.verifyFayda(
      req.user.userId,
      req.body,
      requestContext(req),
    );

    res.status(200).json({
      success: true,
      message: "Identity verified. Your account is now active.",
      data: {
        // The account status inside the previous token is stale, so the client
        // must replace it with this one.
        token: result.token,
        user: result.user,
        verification: result.verification,
        nextStage: "LINK_FUNDING",
      },
    });
  },
);

export const kycStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized("NOT_AUTHENTICATED", "Authentication required.");
    }

    const status = await kycService.getStatus(req.user.userId);

    res.status(200).json({ success: true, data: status });
  },
);
