import { prisma } from "../../../lib/prisma.js";
import { ApiError } from "../../utils/ApiErro.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const communityadminAuth = asyncHandler(async(req,_,next)=>{
    const {communityId }=req.params

    if(!communityId ){
        throw new ApiError(404,"community ID not found")
    }

    const community =await prisma.communitie.findUnique({
        where:{
            id:communityId 
        }
    })
    if(!community){
        throw new ApiError(404,"Commuity not found")
    }

    if(community.adminId != req.user.id ){
        throw new ApiError(403,"User are not authorised to access")
    }
    req.community=community
    next();

})

export {communityadminAuth}