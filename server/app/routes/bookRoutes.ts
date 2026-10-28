import { Router } from "express";
import { listBooks } from "../controller/booksController.ts";
import { requireAuth } from "../middleware/auth.ts";

const bookRouter = Router();

bookRouter.get("/", requireAuth, listBooks);

export default bookRouter;
