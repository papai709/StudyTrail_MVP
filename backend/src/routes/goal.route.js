import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createGoal, deleteGoal, getGoalById, getGoals, updateGoal } from "../controllers/goal.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/").post(createGoal).get(getGoals);
router.route("/:goalId")
    .get(getGoalById)
    .patch(upload.array("proofOfWork", 4), updateGoal)
    .delete(deleteGoal);

export default router;