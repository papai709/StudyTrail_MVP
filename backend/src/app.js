import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(
    cors({
        origin:process.env.CORS_ORIGIN,
        credentials: true
    })
);

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from "./routes/user.route.js"
import postRouter from "./routes/post.route.js"
import likeRouter from "./routes/like.route.js"
import commentRoute from "./routes/comment.route.js"
import goalRoute from "./routes/goal.route.js"
import bookmarkRoute from "./routes/bookmark.route.js"
import connectionRoute from "./routes/connection.route.js"
import gamificationRoute from "./routes/gamification.route.js"
// router declaration
app.use("/api/v1/user", userRouter)
app.use("/api/v1/post", postRouter)
app.use("/api/v1/like", likeRouter)
app.use("/api/v1/comment", commentRoute)
app.use("/api/v1/goal", goalRoute)
app.use("/api/v1/bookmark", bookmarkRoute)
app.use("/api/v1/connection", connectionRoute)
app.use("/api/v1/gamification", gamificationRoute)
export { app }