import { Router } from "express";
import { login, logout, me, signUp } from "../controller/authController.ts";
import { requireAuth } from "../middleware/auth.ts";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

export default authRouter;
