import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path:'./.env'
});

connectDB()

.then(()=>{
    app.listen(process.env.PORT || 8090, ()=>{
        console.log(`Server is running at port : ${process.env.PORT || 8090}`);
    });
})
.catch((error)=>{
    console.log("Mongo_DB connection failed !!!", error);
});