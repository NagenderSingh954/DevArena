import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// asyncHandler(async(req,res)=>{})
//create ,delete,update,comment likes,get comment , get all comments,reply,get commet like,get nested comments

const createComment = asyncHandler(async (req, res) => {
    const { contestId } = req.params
    const { content } = req.body
    if (!content || !content.trim()) {
        throw new ApiError(400, "Please provide the text in the comment")
    }
    if (!contestId) {
        throw new ApiError(400, "Contest Not FOund")
    }

    const comment = await prisma.comment.create({
        data: {
            contestId,
            ownerId: req.user?.id,
            content,
        }
    })
    if (!comment) {
        throw new ApiError(500, "Internalserver Error")
    }

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment created Successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    await prisma.comment.delete({
        where: {
            id: req.comment.id
        }
    })
    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Comment deleted successfully"
        )
    );
})

const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    if (!content || !content.trim()) {
        throw new ApiError(400, "Please provide the text in the comment")
    }

    const newComment = await prisma.comment.update({
        where: {
            id: req.comment.id
        },
        data: {
            content: content.trim(),
        },
        include: {
            owner: {
                select: {
                    avatar: true,
                    fullName: true,
                    username: true
                }
            }
        }
    })
    return res.status(200).json(
        new ApiResponse(
            200,
            newComment,
            "Comment updated successfully"
        )
    );
})

const getContestComment = asyncHandler(async (req, res) => {
    const { contestId } = req.params;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 10);
    const skip = (page - 1) * limit;

    if (!contestId) {
        throw new ApiError(400, "Contest ID is required");
    }

    const [comments, totalComments] = await Promise.all([
        prisma.comment.findMany({
            where: {
                contestId,
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                owner: {
                    select: {
                        fullName: true,
                        username: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        replies: true,
                    },
                },
            },
        }),

        prisma.comment.count({
            where: {
                contestId,
            },
        }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalComments / limit),
                    totalComments,
                    hasNextPage: page < Math.ceil(totalComments / limit),
                    hasPreviousPage: page > 1,
                },
            },
            "Contest comments fetched successfully"
        )
    );
});

const getCommentById = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    const comment = await prisma.comment.findUnique({
        where: {
            id: commentId,
        },
        include: {
             owner: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    likes: true,
                    replies: true,
                },
            },
        },
    });

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment fetched successfully"
        )
    );
});

const getCommentReplies = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 10);
    const skip = (page - 1) * limit;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    const [replies, totalReplies] = await Promise.all([
        prisma.nestedComment.findMany({
            where: {
                parentCommentId: commentId,
                // parentReplyId: null, // Only first-level replies
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "asc",
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                owner: {
                    select: {
                        id: true,
                        fullName: true,
                        username: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        children: true,
                    },
                },
            },
        }),

        prisma.nestedComment.count({
            where: {
                parentCommentId: commentId,
                parentReplyId: null,
            },
        }),
    ]);
    // console.log(replies)

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                replies,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalReplies / limit),
                    totalReplies,
                    hasNextPage: page < Math.ceil(totalReplies / limit),
                    hasPreviousPage: page > 1,
                },
            },
            "Replies fetched successfully"
        )
    );
});

export {
    createComment,updateComment,deleteComment,getContestComment,getCommentById,getCommentReplies
}