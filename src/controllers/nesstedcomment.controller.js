import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";




// toggleReplyLike
// getReplyLikes

const createReply = asyncHandler(async (req, res) => {
    const { commentId, discussionId, replyId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Reply content is required");
    }

    const data = {
        content,
        ownerId: req.user.id,
    };

    // Reply to a comment
    if (commentId) {
        const comment = await prisma.comment.findUnique({
            where: {
                id: commentId,
            },
            select: {
                id: true,
            },
        });

        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }

        data.parentCommentId = commentId;
    }

    // Reply to a discussion
    else if (discussionId) {
        const discussion = await prisma.discussion.findUnique({
            where: {
                id: discussionId,
            },
            // select: {
            //     id: true,
            // },
        });

        if (!discussion) {
            throw new ApiError(404, "Discussion not found");
        }

        data.parentDiscussionId = discussionId;
    }

    // Reply to another reply
    else if (replyId) {
        const parentReply = await prisma.nestedComment.findUnique({
            where: {
                id: replyId,
            },
            // select: {
            //     id: true,
            //     parentCommentId: true,
            //     parentDiscussionId: true,
            // },
        });

        if (!parentReply) {
            throw new ApiError(404, "Reply not found");
        }

        data.parentReplyId = replyId;
        data.parentCommentId = parentReply.parentCommentId;
        data.parentDiscussionId = parentReply.parentDiscussionId;
    }

    else {
        throw new ApiError(
            400,
            "Comment ID, Discussion ID or Reply ID is required"
        );
    }

    const reply = await prisma.nestedComment.create({
        data,
        include: {
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
                    likes: true,
                },
            },
        },
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            reply,
            "Reply created successfully"
        )
    );
});
const updateReply = asyncHandler(async (req, res) => {
    const { replyId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Reply content is required");
    }

    const updatedReply = await prisma.nestedComment.update({
        where: {
            id: replyId,
        },
        data: {
            content: content.trim(),
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
                    children: true,
                },
            },
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, updatedReply, "Reply updated successfully"));
});
const deleteReply = asyncHandler(async (req, res) => {
    const { replyId } = req.params;

    if (!replyId) {
        throw new ApiError(400, "Reply ID is required");
    }

    await prisma.nestedComment.delete({
        where: {
            id: replyId,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Reply deleted successfully"
        )
    );
});
const getNestedReplies = asyncHandler(async (req, res) => {
    const { replyId } = req.params;

    if (!replyId) {
        throw new ApiError(400, "Reply ID is required");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const parentReply = await prisma.nestedComment.findUnique({
        where: {
            id: replyId,
        },
        select: {
            id: true,
        },
    });

    if (!parentReply) {
        throw new ApiError(404, "Reply not found");
    }

    const [replies, totalReplies] = await Promise.all([
        prisma.nestedComment.findMany({
            where: {
                parentReplyId: replyId,
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "asc",
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
                        children: true,
                    },
                },
            },
        }),

        prisma.nestedComment.count({
            where: {
                parentReplyId: replyId,
            },
        }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                replies,
                pagination: {
                    totalReplies,
                    currentPage: page,
                    totalPages: Math.ceil(totalReplies / limit),
                    hasNextPage: page * limit < totalReplies,
                    hasPreviousPage: page > 1,
                },
            },
            "Nested replies fetched successfully"
        )
    );
});
export {createReply,updateReply,deleteReply,getNestedReplies}