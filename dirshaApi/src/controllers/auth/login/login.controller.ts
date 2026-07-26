import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { userAuthService } from "../../../services/auth.service";
import { requestContext } from "../../../utils/requestContext";
import { ApiError } from "../../../utils/ApiError";

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await userAuthService.loginUser(
      req.body,
      requestContext(req),
    );

    res.status(200).json({
      success: true,
      message: "Authentication successful.",
      data: {
        token: result.token,
        user: result.user,
        // Drives the client's post-login redirect: unverified users are sent
        // back into the onboarding flow rather than to the marketplace.
        nextStage:
          result.user.account_status === "ACTIVE_VERIFIED"
            ? "DASHBOARD"
            : "IDENTITY_VERIFICATION",
      },
    });
  },
);

export const currentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized("NOT_AUTHENTICATED", "Authentication required.");
    }

    const user = await userAuthService.getProfile(req.user.userId);

    res.status(200).json({ success: true, data: { user } });
  },
);
