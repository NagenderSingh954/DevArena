import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/prisma.js'

const generateAccessToken =async (userId)=>{
    const userinfo= await prisma.user.findUnique({
  where: { id:userId },
});

    return jwt.sign(
        {
            id:userinfo.id,
            email:userinfo.email,
            username:userinfo.username,
            fullName:userinfo.fullName
        },
         process.env.ACCESS_TOKEN_SECRET,
        {
             expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )

}

const generateRefreshToken =async (userId)=>{
    const userinfo= await prisma.user.findUnique({
  where: { id:userId },
});

    return jwt.sign(
        {
            id:userinfo.id,
            email:userinfo.email,
            username:userinfo.username,
            fullName:userinfo.fullName
        },
         process.env.REFRESH_TOKEN_SECRET,
        {
             expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}

export {generateAccessToken,generateRefreshToken}