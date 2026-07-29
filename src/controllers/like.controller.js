import { prisma } from "../../lib/prisma";
import { ApiError } from "../utils/ApiErro";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


//toggle like on discusstion ,comment and contest user likes


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

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

    const existingLike = await prisma.like.findUnique({
        where: {
            userId_commentId: {
                userId: req.user.id,
                commentId,
            },
        },
    });

    if (existingLike) {
        await prisma.like.delete({
            where: {
                id: existingLike.id,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: false },
                "Comment unliked successfully"
            )
        );
    }

    await prisma.like.create({
        data: {
            userId: req.user.id,
            commentId,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked: true },
            "Comment liked successfully"
        )
    );
});

const toggleDiscussionLike = asyncHandler(async (req, res) => {
    const { discussionId } = req.params;

    if (!discussionId) {
        throw new ApiError(400, "Discussion ID is required");
    }

    const discussion = await prisma.discussion.findUnique({
        where: {
            id: discussionId,
        },
        select: {
            id: true,
        },
    });

    if (!discussion) {
        throw new ApiError(404, "Discussion not found");
    }

    const existingLike = await prisma.like.findUnique({
        where: {
            userId_discussionId: {
                userId: req.user.id,
                discussionId,
            },
        },
    });

    if (existingLike) {
        await prisma.like.delete({
            where: {
                id: existingLike.id,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: false },
                "Discussion unliked successfully"
            )
        );
    }

    await prisma.like.create({
        data: {
            userId: req.user.id,
            discussionId,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked: true },
            "Discussion liked successfully"
        )
    );
});

const toggleContestLike = asyncHandler(async (req, res) => {
    const { contestId } = req.params;

    if (!contestId) {
        throw new ApiError(400, "Contest ID is required");
    }

    const contest = await prisma.contest.findUnique({
        where: {
            id: contestId,
        },
        select: {
            id: true,
        },
    });

    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    const existingLike = await prisma.like.findUnique({
        where: {
            userId_contestId: {
                userId: req.user.id,
                contestId,
            },
        },
    });

    if (existingLike) {
        await prisma.like.delete({
            where: {
                id: existingLike.id,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: false },
                "Contest unliked successfully"
            )
        );
    }

    await prisma.like.create({
        data: {
            userId: req.user.id,
            contestId,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked: true },
            "Contest liked successfully"
        )
    );
});

const toggleNestedCommentLike = asyncHandler(async (req, res) => {
    const { nestedCommentId } = req.params;

    if (!nestedCommentId) {
        throw new ApiError(400, "Reply ID is required");
    }

    const reply = await prisma.nestedComment.findUnique({
        where: {
            id: nestedCommentId,
        },
        select: {
            id: true,
        },
    });

    if (!reply) {
        throw new ApiError(404, "Reply not found");
    }

    const existingLike = await prisma.like.findUnique({
        where: {
            userId_nestedCommentId: {
                userId: req.user.id,
                nestedCommentId,
            },
        },
    });

    if (existingLike) {
        await prisma.like.delete({
            where: {
                id: existingLike.id,
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: false },
                "Reply unliked successfully"
            )
        );
    }

    await prisma.like.create({
        data: {
            userId: req.user.id,
            nestedCommentId,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked: true },
            "Reply liked successfully"
        )
    );
});

export {toggleCommentLike,toggleContestLike,toggleDiscussionLike,toggleNestedCommentLike}