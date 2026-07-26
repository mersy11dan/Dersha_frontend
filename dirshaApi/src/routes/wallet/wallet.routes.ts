import { Router } from "express";
import {
  depositController,
  withdrawController,
  walletBalanceController,
  walletTransactionsController,
  walletTransactionController,
  paymentWebhookController,
} from "../../controllers/wallet/wallet.controller";
import {
  authenticate,
  requireVerifiedAccount,
} from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validator.middleware";
import {
  WalletDepositRequestSchema,
  WalletWithdrawalRequestSchema,
} from "../../schemas/wallet.schema";

const walletRouter = Router();

// The gateway callback is authenticated by a shared webhook signature, not a
// user token, so it is registered before the bearer-token guard.
walletRouter.post("/webhook/payment", paymentWebhookController);

walletRouter.use(authenticate, requireVerifiedAccount);

walletRouter.get("/balance", walletBalanceController);
walletRouter.get("/transactions", walletTransactionsController);
walletRouter.get("/transactions/:transactionId", walletTransactionController);

walletRouter.post(
  "/deposit",
  validateRequest(WalletDepositRequestSchema),
  depositController,
);

walletRouter.post(
  "/withdraw",
  validateRequest(WalletWithdrawalRequestSchema),
  withdrawController,
);

export { walletRouter };
