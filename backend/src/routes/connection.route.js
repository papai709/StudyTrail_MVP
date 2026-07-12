import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { acceptConnectionRequest, getMyConnections, getPendingRequests, removeConnection, sendConnectionRequest } from "../controllers/connection.controller.js";

const router = Router()
router.use(verifyJWT);

router.route("/request/:receiverId").post(sendConnectionRequest);
router.route("/accept/:requestId").patch(acceptConnectionRequest);
router.route("/remove/:requestId").delete(removeConnection);
router.route("/pending").get(getPendingRequests);
router.route("/my-network").get(getMyConnections);


export default router;