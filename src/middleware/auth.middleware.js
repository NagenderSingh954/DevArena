import { access } from "node:fs";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiErro.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'


const varifyJWt=asyncHandler(async(req,__dirname,next)=>{
 
   try {
     let token=req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ","")
     const verification = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     const user= await prisma.user.findUnique({
         where:{
             id:verification.id
         },
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            avatar: true,
            role: true,
            type: true,
            bio: true,
            git: true,
            phone: true,
            emailVerified: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
     })
     if(!user){
         throw new ApiError(400,"Invalid AccessToken ")
    }
 
     req.user=user
     next()
   } catch (error) {
   
        throw new ApiError(400,"Invalid Access Token ",error)
   }
})


const socketAuthenticator=async(error,socket,next)=>{
   try {
     if(error){
         return next(error);
     }
 
     const authToken= socket.request.cookies?.accessToken;
     console.log(authToken)
 
     if (!authToken) {
            return next(
                new ApiError(
                    401,
                    "Please Login to access the resources"
                )
            );
        }

      const verification = jwt.verify(authToken,process.env.ACCESS_TOKEN_SECRET)
       const user= await prisma.user.findUnique({
          where:{
              id:verification.id
          },
           select: {
             id: true,
             username: true,
             email: true,
             fullName: true,
             avatar: true,
             role: true,
             type: true,
             bio: true,
             git: true,
             phone: true,
             emailVerified: true,
             status: true,
             createdAt: true,
             updatedAt: true,
         },
      })
     if (!user) {
            return next(
                new ApiError(
                    401,
                    "Invalid Access Token"
                )
            );
        }
     socket.user = user;
     return next()
   } catch (error) {
     console.error("Socket authentication error:", error);

        return next(
            new ApiError(
                401,
                "Invalid Access Token"
            )
        );
   }
}

export {varifyJWt,socketAuthenticator}