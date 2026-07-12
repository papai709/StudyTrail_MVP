import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleCommentLike, togglePostLike } from "../controllers/like.controller.js";


const router = Router();

router.use(verifyJWT);

router.route("/toggle/post-id/:postId").post(togglePostLike);
router.route("/toggle/comment-id/:commentId").post(toggleCommentLike);

export default router;