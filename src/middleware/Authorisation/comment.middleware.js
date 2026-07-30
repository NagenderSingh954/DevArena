import { prisma } from "../../../lib/prisma.js";
import { ApiError } from "../../utils/ApiErro.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


const commentAuth=asyncHandler(async(req,_,next)=>{
    const {commentId}=req.params

    if(!commentId){
        throw new ApiError(404,"Comment ID not found")
    }

    const comment =await prisma.comment.findUnique({
        where:{
            id:commentId
        }
    })
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    if(comment.ownerId != req.user.id ){
        throw new ApiError(403,"User are not authorised to access")
    }
    req.comment=comment
    next();

})

export {commentAuth}