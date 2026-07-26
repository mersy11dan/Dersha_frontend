import { Router } from "express";
import {
  loginController,
  currentUserController,
} from "../../controllers/auth/login/login.controller";
import { accountTempRegistrationController } from "../../controllers/auth/register/register.controller";
import { validateRequest } from "../../middleware/validator.middleware";
import {
  UserRegistrationRequestSchema,
  UserLoginRequestSchema,
} from "../../schemas/user.schema";
import { authenticate } from "../../middleware/auth.middleware";

const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest(UserRegistrationRequestSchema),
  accountTempRegistrationController,
);

authRouter.post(
  "/login",
  validateRequest(UserLoginRequestSchema),
  loginController,
);

authRouter.get("/me", authenticate, currentUserController);

export { authRouter };
