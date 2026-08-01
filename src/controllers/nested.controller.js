import { prisma } from '../../lib/prisma';
import { ApiError } from '../utils/ApiErro';
import { ApiResponse } from '../utils/ApiResponse';
import {asyncHandler} from '../utils/asyncHandler'

// create update delte getreply by id

const createNested=asyncHandler(async (req,res)=>{
    const { commentId, discussionId, replyId } = req.params;
    const { content } = req.body;
    const ownerId = req.user.id;
    if(!contest || contest.trim()==''){
        throw new ApiResponse(400,"Content is Required")
    }
    let data={
        content,
        ownerId,
    }
    if(discussionId){
       const dis=await prisma.discussion.findUnique({
        where:{
            id:discussionId
        }
       })
       if(!dis){
         throw new ApiError(404, "Discussion not found");
       }
       data.parentDiscussionId=discussionId
    }else if(commentId){
        const com=await prisma.comment.findUnique({
        where:{
            id:commentId
        }
       })
       if(!com){
         throw new ApiError(404, "comment not found");
       }
       data.parentCommentId=commentId
    }else if(replyId){
        const rep=await prisma.nestedComment.findUnique({
        where:{
            id:replyId
        }
       })
       if(!rep){
         throw new ApiError(404, "parent not found");
       }
       data.parentReplyId=replyId
    }else{
          throw new ApiError(400, "Invalid parent");
    }

    const nestedComment = await prisma.nestedComment.create({
        data,
        include:{
            owner:{
                select:{
                    id:true,
                    avatar:true,
                    username:true,
                    fullName:true
                }
            },
            _count: {
                select: {
                    children: true,
                    likes: true,
                },
            },
        }
    })

    if(!nestedComment){
        throw new ApiError(400,"Error Happen While Creating the nested Comments")
    }

    return res.status(200).json(
        new ApiResponse(200,nestedComment,"Replie created successfully ")
    )



})

const updateReply=asyncHandler(async(req,res)=>{
     const { content } = req.body;
    if(!contest || contest.trim()==''){
        throw new ApiResponse(400,"Content is Required")
    }
    const updated=await prisma.nestedComment.update({
        data:{
            content,
        },
        include:{
            owner:{
                select:{
                    avatar:true,
                    username:true
                }
            }
        }
    })
    if(!updated){
        throw new ApiError(400,"Error while updating the reply")
    }

    return res.status(200).json(
        new ApiResponse(200,updated,"Reply updated Successfully ")
    )
})

const deletereply=asyncHandler(async(req,res)=>{
    const { replyId } = req.params;

    if (!replyId) {
        throw new ApiError(400, "Reply ID is required");
    }
    await prisma.nestedComment.delete({
        where:{
            id:replyId
        }
    })
    return res.status(200).json(
        new ApiResponse(200,{},"Reply deleted Successfull")
    )
})

const getReplyById=asyncHandler(async(req,res)=>{
    const {replyId}=req.params
    if(!replyId){
        throw new ApiError(400,"Reply id not found")
    }

    const reply=await prisma.nestedComment.findUnique({
        where:{
            id:replyId
        },
        include:{
            owner:{
                select:{
                    avatar:true,
                    username:true
                }
            },
            _count:{
                select:{
                    likes:true,
                    children:true
                }
            }
        }
    })

    if(!reply){
        throw new ApiError(404,"reply not found")
    }

    return res.status(200).json(
        new ApiResponse(200,reply,"Reply fetched Successfully ")
    )


})

const getnestedReplyofReply=asyncHandler(async(req,res)=>{
    const {replyId}=req.params
    const page=Math.max(Number(req.query.page) || 1,1) 
     const limit = 20;
    const skip = (page - 1) * limit;

       if(!replyId){
        throw new ApiError(400,"Reply id not found")
    }

    const [replies,total]= await prisma.$transaction([
        prisma.nestedComment.findMany({
            where:{
                parentReplyId:replyId,
            },
            skip,
            take:limit,
             orderBy: {
                createdAt: "asc",
            },
            include:{
            owner:{
                select:{
                    id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                }
            },
            _count:{
                select:{
                    likes:true,
                    children:true
                }
            }
        }
        }),
        prisma.nestedComment.count({
             where:{
                parentReplyId:replyId,
            }
        })
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                replies,
                pagination:{
                    limit,
                    totalResult:total,
                    currentpage:page,
                    totalPage:Math.ceil(total/limit)

                }
            },
            "Replies Fetched Successfully"
        )
    )
})


export {createNested,updateReply,deletereply,getReplyById,getnestedReplyofReply}