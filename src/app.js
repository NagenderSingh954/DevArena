import express from 'express'
import { prisma } from '../lib/prisma.js'
import userRouter from './routers/user.routes.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app=express()


// const allowedOrigins = process.env.CORS_ORIGIN.split(",").map(origin => origin.trim());

// app.use(
//     cors({
//         origin: (origin, callback) => {
//             if (!origin || allowedOrigins.includes(origin)) {
//                 callback(null, true);
//             } else {
//                 callback(new Error("Not allowed by CORS"));
//             }
//         },
//         credentials: true,
//     })
// ); 
app.use(cors())
app.use(express.json())
app.use(express.urlencoded())
app.use(express.static('public'))       //public is our foldee
app.use(cookieParser())


app.post('/users',async (req,res) =>{
    try {
       const resp= await prisma.user.create({
            data:{
                email:req.body.email,
                name:req.body.name
            }
        })
        return res.status(200).json({
            message:"User Has been created successfully",
            user:resp
        })
    } catch (error) {
        console.log("There is error while creating the user ",error)
        return res.status(401).json({message:error.message})
    }
}).get(async (req,res)=>{
    const all=await prisma.user.findMany()
     return res.status(200).json({
            message:"User fetched successfully",
            user:all
        })
})

app.use('/api/v1/users',userRouter)
// app.listen(3000,(error)=>{
//     if(error){
//         console.error(error)
//         process.exit(1)
//     }
//     console.log("App is listing on the port 3000")
// })

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: err.success || false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});
 export default app