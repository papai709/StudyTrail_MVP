import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLeaderboard, getMyStats, getNetworkStreaks } from "../controllers/gamification.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/my-stats").get(getMyStats);
router.route("/leaderboard").get(getLeaderboard);
router.route("/network-streaks").get(getNetworkStreaks);
export default router;