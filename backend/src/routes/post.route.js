import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createAPost, deletePost, getAllPost, getUserPosts, updatePost } from "../controllers/post.controller.js";

const router = Router();

router.use(verifyJWT)

router.route("/").post(upload.array("attachments", 4), createAPost).get(getAllPost);
router.route("/my-posts").get(getUserPosts);
router.route("/:postId").patch(updatePost).delete(deletePost)

export default router;
