import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getBookmarkedPosts, toggleBookmark } from "../controllers/bookmark.controller.js";


const router = Router();
router.use(verifyJWT);

router.route("/").get(getBookmarkedPosts);
router.route("/toggle/:postId").post(toggleBookmark);

export default router;
