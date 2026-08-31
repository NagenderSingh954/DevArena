import { prisma } from "../../lib/prisma.js";
import redis from "../db/redis.js";
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import otpEmailTemplate from "../utils/emailtamplate.js";
import { emailQueue } from "../utils/queue.js";
import { otpkey } from "../utils/varification.js";

const generator=asyncHandler(async (req,res)=>{
    const {email}=req.user
   const otp = Math.floor(100000 + Math.random() * 900000);
    await redis.set(otpkey(email),`${otp}`,"EX",180)

    const job =await emailQueue.add("Send OTP",{
    from: "CodeArena <onboarding@resend.dev>",
    to: "nagendersingh954@gmail.com",
    subject: "Verify your CodeArena email",
    html: otpEmailTemplate(otp)
})

    return res.status(200).json(
        new ApiResponse(200,job,"OTP Email has Been Sended Successfully")
    )
})

const getOTP=asyncHandler(async (req,res)=>{
    const {email}=req.params;
    const otp =await redis.get(otpkey(email));
    if(!otp){
        throw new ApiError(400,"No OTP Found")
    }
    return res.status(200).json(
        new ApiResponse(200,otp,"OTP Founded Successfully")
    )

})

const varifyOTP=asyncHandler(async (req,res)=>{
    const {email,otp}=req.body;
    const saved=await redis.get(otpkey(phone))
    if(!saved){
        
           throw new ApiError(404,"OTP Expired")
        
    }
    if(saved !== otp){
        throw new ApiError(404,"Otp is invalid please enter the correct otp")
    }
    await redis.del(otpkey(phone))

     const updatedUser = await prisma.user.update({
            where: {
                email
            },
            data: {
                emailVerified:true
            },
            select:{
                id:true,
                email:true,
                emailVerified:true, 
            }
        })
        if(!updatedUser){
            throw new ApiError(500,"OTP Varified But there is issue While Updating teh User ")
        }

    return res.status(200).json(
        new ApiResponse(200,updatedUser,"OTP Has Been Varified SuccessFully")
    )
})




export {generator,getOTP,varifyOTP}