import { Router } from "express";

const userRouter = Router();

userRouter.get("/");

userRouter.post("/");

userRouter.put("/:user_id");

userRouter.delete("/:user_id");

export { userRouter };
