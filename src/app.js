import express from 'express'
import { prisma } from '../lib/prisma.js'

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

import userRouter from './routers/user.routes.js'
import contestRouter from './routers/contest.routes.js'
import problemRouter from './routers/problem.routes.js'
import languageRouter from './routers/language.routes.js'
import followerRouter from './routers/follower.routes.js'
import commentRoute from './routers/comments.routes.js'
import likeRoute from './routers/like.routes.js'
import discussionRoute from './routers/disccusion.routes.js'
import nestedRoute from './routers/nested.routes.js'
import communityRoute from './routers/community.routes.js'
import chatRoute from './routers/chat.routes.js'

app.use('/api/v1/users',userRouter)
app.use('/api/v1/contest',contestRouter)
app.use('/api/v1/:contestId/problem',problemRouter)
app.use('/api/v1/language',languageRouter)
app.use('/api/v1/:userId/follow',followerRouter)
app.use('/api/v1/comment',commentRoute)
app.use('/api/v1/discussion',discussionRoute)
app.use('/api/v1/nest',nestedRoute)
app.use('/api/v1/like',likeRoute)
// app.use('/api/v1/community',communityRoute)
app.use('/api/v1/chat',chatRoute)


app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: err.success || false,
        message: err.message || "Internal Server Error",
        errors: err.errors || []
    });
});
 export default app