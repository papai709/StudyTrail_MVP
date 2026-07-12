import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    getCurrentUser, 
    completeUserProfile, 
    updateAccountDetails,
    updateUserProfileImage,
    updateUserCoverImage,
    getRecommendedUsers,
    getUserProfile
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secured routes(only logged-in user)
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/recommendations").get(verifyJWT, getRecommendedUsers)

router.route("/complete-profile").patch(
    verifyJWT,
    upload.fields([
        {
            name: "profileImage",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    completeUserProfile
);

router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router.route("/update-profile-image").patch(verifyJWT, upload.single("profileImage"), updateUserProfileImage)
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.get("/profile/:userId", verifyJWT, getUserProfile);
export default router;