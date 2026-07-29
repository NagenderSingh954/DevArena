import { prisma } from "../../../lib/prisma";
import { ApiError } from "../../utils/ApiErro";
import { asyncHandler } from "../../utils/asyncHandler";


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