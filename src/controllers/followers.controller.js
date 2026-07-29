import { asyncHandler } from "../utils/asyncHandler";

// toggleFollow
// getFollowers
// getFollowing
// getFollowStatus

const toggleFollow = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Prevent following yourself
    if (userId === req.user.id) {
        throw new ApiError(400, "You cannot follow yourself");
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if already following
    const existingFollow = await prisma.follower.findUnique({
        where: {
            followerId_followingId: {
                followerId: req.user.id,
                followingId: userId,
            },
        },
    });

    if (existingFollow) {
        await prisma.follower.delete({
            where: {
                followerId_followingId: {
                    followerId: req.user.id,
                    followingId: userId,
                },
            },
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    isFollowing: false,
                },
                "User unfollowed successfully"
            )
        );
    }

    await prisma.follower.create({
        data: {
            followerId: req.user.id,
            followingId: userId,
        },
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                isFollowing: true,
            },
            "User followed successfully"
        )
    );
});
const getFollowers = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const [followers, totalFollowers] = await Promise.all([
        prisma.follower.findMany({
            where: {
                followingId: userId,
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            select: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
        }),

        prisma.follower.count({
            where: {
                followingId: userId,
            },
        }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                followers: followers.map((item) => item.follower),
                pagination: {
                    totalFollowers,
                    currentPage: page,
                    totalPages: Math.ceil(totalFollowers / limit),
                    hasNextPage: page * limit < totalFollowers,
                    hasPreviousPage: page > 1,
                },
            },
            "Followers fetched successfully"
        )
    );
});
const getFollowing = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const [following, totalFollowing] = await Promise.all([
        prisma.follower.findMany({
            where: {
                followerId: userId,
            },
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            select: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        avatar: true,
                    },
                },
            },
        }),

        prisma.follower.count({
            where: {
                followerId: userId,
            },
        }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                following: following.map((item) => item.following),
                pagination: {
                    totalFollowing,
                    currentPage: page,
                    totalPages: Math.ceil(totalFollowing / limit),
                    hasNextPage: page * limit < totalFollowing,
                    hasPreviousPage: page > 1,
                },
            },
            "Following fetched successfully"
        )
    );
});
const getFollowStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // If viewing own profile
    if (userId === req.user.id) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    isFollowing: false,
                    isOwnProfile: true,
                },
                "Follow status fetched successfully"
            )
        );
    }

    const follow = await prisma.follower.findUnique({
        where: {
            followerId_followingId: {
                followerId: req.user.id,
                followingId: userId,
            },
        },
        select: {
            id: true,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isFollowing: !!follow,
                isOwnProfile: false,
            },
            "Follow status fetched successfully"
        )
    );
});