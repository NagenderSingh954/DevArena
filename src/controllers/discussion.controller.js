import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// create update delete get all get dby id get replie  


const createDiscussion = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Discussion content is required");
    }

    const discussion = await prisma.discussion.create({
        data: {
            ownerId: req.user.id,
            content: content.trim(),
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    replies: true,
                    like: true,
                },
            },
        },
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            discussion,
            "Discussion created successfully"
        )
    );
});

const updateDiscussion = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Discussion content is required");
    }

    const updatedDiscussion = await prisma.discussion.update({
        where: {
            id: req.discussion.id,
        },
        data: {
            content: content.trim(),
            isEdited: true,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    replies: true,
                    like: true,
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedDiscussion,
            "Discussion updated successfully"
        )
    );
});

const deleteDiscussion = asyncHandler(async (req, res) => {

    await prisma.discussion.delete({
        where: {
            id: req.discussion.id,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Discussion deleted successfully"
        )
    );
});

const getAllDiscussions = asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [discussions, totalDiscussions] = await prisma.$transaction([
        prisma.discussion.findMany({
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                _count: {
                    select: {
                        replies: true,
                        like: true,
                    },
                },
            },
        }),

        prisma.discussion.count(),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                discussions,
                pagination: {
                    total: totalDiscussions,
                    currentPage: page,
                    totalPages: Math.ceil(totalDiscussions / limit),
                    limit,
                    hasNextPage: page < Math.ceil(totalDiscussions / limit),
                    hasPreviousPage: page > 1,
                },
            },
            "Discussions fetched successfully"
        )
    );
});

const getDiscussionById = asyncHandler(async (req, res) => {
    const { discussionId } = req.params;

    if (!discussionId) {
        throw new ApiError(400, "Discussion ID is required");
    }

    const discussion = await prisma.discussion.findUnique({
        where: {
            id: discussionId,
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    replies: true,
                    like: true,
                },
            },
        },
    });

    if (!discussion) {
        throw new ApiError(404, "Discussion not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            discussion,
            "Discussion fetched successfully"
        )
    );
});

const getDiscussionReplies = asyncHandler(async (req, res) => {
    const { discussionId } = req.params;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [replies, totalReplies] = await prisma.$transaction([
        prisma.nestedComment.findMany({
            where: {
                parentDiscussionId: discussionId,
                parentReplyId: null,
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
        }),

        prisma.nestedComment.count({
            where: {
                parentDiscussionId: discussionId,
                parentReplyId: null,
            },
        }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                replies,
                pagination: {
                    total: totalReplies,
                    currentPage: page,
                    totalPages: Math.ceil(totalReplies / limit),
                    limit,
                },
            },
            "Replies fetched successfully"
        )
    );
});
const getReplyChildren = asyncHandler(async (req, res) => {
    const { replyId } = req.params;

    const replies = await prisma.nestedComment.findMany({
        where: {
            parentReplyId: replyId,
        },
        orderBy: {
            createdAt: "asc",
        },
        include: {
            owner: {
                select: {
                    id: true,
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

    return res.status(200).json(
        new ApiResponse(
            200,
            replies,
            "Child replies fetched successfully"
        )
    );
});
export {
    createDiscussion,updateDiscussion,deleteDiscussion,getAllDiscussions,getDiscussionById,getDiscussionReplies
}