import { Router } from "express";
import {
  verifyFaydaController,
  kycStatusController,
} from "../../controllers/auth/register/register.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validator.middleware";
import { FaydaKYCRequestSchema } from "../../schemas/user.schema";

const kycRouter = Router();

// Reachable while the account is still PENDING_KYC, which is the whole point of
// this step, so it uses the plain authenticate guard.
kycRouter.post(
  "/verify-fayda",
  authenticate,
  validateRequest(FaydaKYCRequestSchema),
  verifyFaydaController,
);

kycRouter.get("/status", authenticate, kycStatusController);

export { kycRouter };
