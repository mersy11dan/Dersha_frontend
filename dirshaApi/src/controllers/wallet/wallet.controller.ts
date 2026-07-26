import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { walletService } from "../../services/wallet.service";
import { requestContext } from "../../utils/requestContext";
import { ApiError } from "../../utils/ApiError";
import { PaymentWebhookSchema } from "../../schemas/wallet.schema";
import { verifyWebhookSignature } from "../../integrations/payments.adapter";
import { isMockMode } from "../../config/env";

function requireUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized("NOT_AUTHENTICATED", "Authentication required.");
  }
  return req.user.userId;
}

export const walletBalanceController = asyncHandler(
  async (req: Request, res: Response) => {
    const balance = await walletService.getBalance(requireUserId(req));
    res.status(200).json({ success: true, data: balance });
  },
);

export const walletTransactionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const transactions = await walletService.getTransactions(
      requireUserId(req),
      limit,
    );
    res.status(200).json({ success: true, data: transactions });
  },
);

export const walletTransactionController = asyncHandler(
  async (req: Request, res: Response) => {
    const transaction = await walletService.getTransaction(
      requireUserId(req),
      String(req.params.transactionId),
    );
    res.status(200).json({ success: true, data: transaction });
  },
);

export const depositController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await walletService.initiateDeposit(
      requireUserId(req),
      req.body,
      requestContext(req),
    );

    res.status(202).json({
      success: true,
      message:
        "Deposit initiated. Authorise the payment in your mobile money or banking app.",
      data: result,
    });
  },
);

export const withdrawController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await walletService.requestWithdrawal(
      requireUserId(req),
      req.body,
      requestContext(req),
    );

    res.status(202).json({
      success: true,
      message: "Withdrawal submitted. Funds are held in escrow pending bank settlement.",
      data: result,
    });
  },
);

/**
 * Settlement callback from the payment switch.
 *
 * Authenticated by an HMAC signature over the raw body rather than a user
 * token, because the caller is the gateway. The signature check is skipped in
 * MOCK mode so the simulator can post callbacks without shared secrets.
 */
export const paymentWebhookController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!isMockMode) {
      const rawBody = JSON.stringify(req.body);
      const signature = req.headers["x-gateway-signature"];

      if (
        !verifyWebhookSignature(
          rawBody,
          Array.isArray(signature) ? signature[0] : signature,
        )
      ) {
        throw ApiError.unauthorized(
          "INVALID_WEBHOOK_SIGNATURE",
          "The webhook signature could not be verified.",
        );
      }
    }

    const payload = PaymentWebhookSchema.parse(req.body);

    await walletService.settleDeposit(payload.external_reference, {
      status: payload.status,
      failureReason: payload.failure_reason,
    });

    // Always 200 so the gateway stops retrying a callback we have accepted.
    res.status(200).json({ success: true, received: true });
  },
);
