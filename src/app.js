import express from 'express'
import { prisma } from '../lib/prisma.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import { createServer } from 'http'
import {v4 as uuid} from 'uuid'
import { getSockets } from './utils/features.js'
import { socketAuthenticator } from './middleware/auth.middleware.js'
import { corsOptions } from './constant/config.js'  
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from './constant/event.js'

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


const server=createServer(app)

const io=new Server(server,{cors:corsOptions});

app.set("io",io)

const userSocketIDs= new Map();

io.use((socket, next) => {
    console.log("Cookie header:", socket.request.headers.cookie);
  cookieParser()(
    socket.request,         // req
    socket.request.res,    // res
    async (err) => await socketAuthenticator(err, socket, next)     //callback function like next()
  );
});  //exprese cookieparser not work in the socket 
io.on("connection",(socket)=>{
      console.log("User connected:", socket.id);
   
    const user=socket.user;
  

      userSocketIDs.set(user.id.toString(),socket.id)

        socket.on(NEW_MESSAGE,async({communityId,members,message})=>{
            const messageForRealTime={
                id:uuid(),
                content:message,
                sender:{
                    id:user.id,
                    name:user.username
                },
                chat:communityId,
                createdAt:new Date().toISOString()
            }

            const messageForDB= {
                content:message,
                communityId:communityId,
                senderId:user.id
            }

            const memebersSockets=getSockets(members)
            console.log("NEW_MESSAGE",messageForRealTime);
        
            // io.emit(NEW_MESSAGE,messageForDB);
            io.to(members).emit(NEW_MESSAGE,{
                communityId,
                message:messageForRealTime

            })
             io.to(members).emit(NEW_MESSAGE_ALERT,{
                communityId,})
            try {
                await prisma.message.create({
                    data:messageForDB
                })
            } catch (error) {
                console.log(error)
            }

        })
        
     
        console.log(userSocketIDs)
      socket.on("disconnect",()=>{
        userSocketIDs.delete(user.id.toString());
        console.log("User Disconnected")
      })
})

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

import { send } from 'process'



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
 export {app,server,userSocketIDs}