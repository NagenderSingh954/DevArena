import app from './app.js'
import { connectDB } from './db/index.js'
import dotenv from 'dotenv';


dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.error("Express application error:", error);
         throw error;
    })
    app.listen(process.env.PORT || 8000,(error)=>{
    if(error){
        console.error(error)
        process.exit(1)
    }
    console.log(`Application is listening on ${process.env.PORT}`);
})
})
.catch((err) => {
    console.log("PostgreSQL Connection Failed!!!", err);
});