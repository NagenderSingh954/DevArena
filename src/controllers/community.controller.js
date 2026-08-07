import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

 const createCommunity = asyncHandler(async (req, res) => {
    const { name, description, avatar } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !name.trim()) {
        throw new ApiError(400, "Community name is required.");
    }

    // Check if a community with the same name already exists
    const existingCommunity = await prisma.communitie.findFirst({
        where: {
            name: name.trim(),
        },
    });

    if (existingCommunity) {
        throw new ApiError(409, "A community with this name already exists.");
    }

    // Create community and add creator as member
    const community = await prisma.$transaction(async (tx) => {

        const createdCommunity = await tx.communitie.create({
            data: {
                name: name.trim(),
                description,
                avatar,
                adminId: userId,
            },
        });

        await tx.communityMember.create({
            data: {
                communityId: createdCommunity.id,
                userId: userId,
            },
        });

        return createdCommunity;
    });

    // Return community with admin details
    const result = await prisma.communitie.findUnique({
        where: {
            id: community.id,
        },
        include: {
            admin: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            result,
            "Community created successfully."
        )
    );
});

const updateCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const { name, description, avatarId } = req.body;

    const updateData = {};

    if (name !== undefined) {
        const trimmedName = name.trim();

        if (!trimmedName) {
            throw new ApiError(400, "Community name is required.");
        }

        if (trimmedName !== req.community.name) {
            const existingCommunity = await prisma.communitie.findFirst({
                where: {
                    name: trimmedName,
                    NOT: {
                        id: communityId,
                    },
                },
            });

            if (existingCommunity) {
                throw new ApiError(409, "Community name already exists.");
            }
        }

        updateData.name = trimmedName;
    }

    if (description !== undefined) {
        updateData.description = description?.trim() || null;
    }

    if (avatarId !== undefined) {
        updateData.avatarId = avatarId;
    }

    const updatedCommunity = await prisma.communitie.update({
        where: {
            id: communityId,
        },
        data: updateData,
        include: {
            admin: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedCommunity,
            "Community updated successfully."
        )
    );
});

const deleteCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    await prisma.communitie.delete({
        where: {
            id: communityId,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Community deleted successfully."
        )
    );
});  //pending

const updateCommunityPermissions = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    const {
        allowMessages,
        allowMedia,
        allowFiles,
        allowMemberInvite,
        allowMemberEdit,
        onlyAdminCanAnnounce,
        onlyAdminCanPin,
    } = req.body;

    const updateData = {};

    if (allowMessages !== undefined)
        updateData.allowMessages = allowMessages;

    if (allowMedia !== undefined)
        updateData.allowMedia = allowMedia;

    if (allowFiles !== undefined)
        updateData.allowFiles = allowFiles;

    if (allowMemberInvite !== undefined)
        updateData.allowMemberInvite = allowMemberInvite;

    if (allowMemberEdit !== undefined)
        updateData.allowMemberEdit = allowMemberEdit;

    if (onlyAdminCanAnnounce !== undefined)
        updateData.onlyAdminCanAnnounce = onlyAdminCanAnnounce;

    if (onlyAdminCanPin !== undefined)
        updateData.onlyAdminCanPin = onlyAdminCanPin;

    const updatedCommunity = await prisma.communitie.update({
        where: {
            id: communityId,
        },
        data: updateData,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedCommunity,
            "Community permissions updated successfully."
        )
    );
});

const getCommunityById = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    if(!communityId){
        throw new ApiError(404,"Community id Not Found")
    }

    const community = await prisma.communitie.findUnique({
        where: {
            id: communityId,
        },
        include: {
            admin: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });

    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            community,
            "Community fetched successfully."
        )
    );
});

const getAllCommunities = asyncHandler(async (req, res) => {
    const communities = await prisma.communitie.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            admin: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            communities,
            "Communities fetched successfully."
        )
    );
});

const searchCommunities = asyncHandler(async (req, res) => {
    const { name } = req.query;

    if (!name || !name.trim()) {
        throw new ApiError(400, "Community name is required.");
    }

    const communities = await prisma.communitie.findMany({
        where: {
            name: {
                contains: name.trim(),
                mode: "insensitive",
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            admin: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            communities,
            "Communities fetched successfully."
        )
    );
});

const getUserCommunities = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const communities = await prisma.communityMember.findMany({
        where: {
            userId,
        },
        include: {
            community: {
                include: {
                    admin: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                    _count: {
                        select: {
                            members: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            joinedAt: "desc",
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            communities,
            "User communities fetched successfully."
        )
    );
});

const joinCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.user.id;

    const community = await prisma.communitie.findUnique({
        where: {
            id: communityId,
        },
    });

    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    const existingMember = await prisma.communityMember.findUnique({
        where: {
            userId_communityId: {
                userId,
                communityId,
            },
        },
    });

    if (existingMember) {
        throw new ApiError(409, "You have already joined this community.");
    }

    await prisma.communityMember.create({
        data: {
            userId,
            communityId,
        },
    });

    const joinedCommunity = await prisma.communitie.findUnique({
        where: {
            id: communityId,
        },
        include: {
            admin: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                },
            },
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            joinedCommunity,
            "Joined community successfully."
        )
    );
});

const leaveCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.user.id;

    const membership = await prisma.communityMember.findUnique({
        where: {
            userId_communityId: {
                userId,
                communityId,
            },
        },
    });

    if (!membership) {
        throw new ApiError(404, "You are not a member of this community.");
    }

    const community = await prisma.communitie.findUnique({
        where: {
            id: communityId,
        },
        include: {
            _count: {
                select: {
                    members: true,
                },
            },
        },
    });

    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    if (
        community.adminId === userId &&
        community._count.members > 1
    ) {
        throw new ApiError(
            400,
            "Transfer ownership or remove all members before leaving the community."
        );
    }

    await prisma.communityMember.delete({
        where: {
            userId_communityId: {
                userId,
                communityId,
            },
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Left community successfully."
        )
    );
});

const getCommunityMembers = asyncHandler(async (req, res) => {
    const { communityId } = req.params;

    const community = await prisma.communitie.findUnique({
        where: {
            id: communityId,
        },
    });

    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    const members = await prisma.communityMember.findMany({
        where: {
            communityId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                },
            },
        },
        orderBy: {
            joinedAt: "asc",
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            members,
            "Community members fetched successfully."
        )
    );
});

const removeMember = asyncHandler(async (req, res) => {
    const { communityId, userId } = req.params;

    if (req.community.adminId === userId) {
        throw new ApiError(400, "Community admin cannot be removed.");
    }

    const member = await prisma.communityMember.findUnique({
        where: {
            userId_communityId: {
                userId,
                communityId,
            },
        },
    });

    if (!member) {
        throw new ApiError(404, "Member not found.");
    }

    await prisma.communityMember.delete({
        where: {
            userId_communityId: {
                userId,
                communityId,
            },
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Member removed successfully."
        )
    );
});

const getUserCommunitiesByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const communities = await prisma.communityMember.findMany({
        where: {
            userId,
        },
        include: {
            community: {
                include: {
                    admin: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                    _count: {
                        select: {
                            members: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            joinedAt: "desc",
        },
    });

    const data = communities.map(({ community }) => community);

    return res.status(200).json(
        new ApiResponse(
            200,
            data,
            "User communities fetched successfully."
        )
    );
});


export {createCommunity,updateCommunity,deleteCommunity,updateCommunityPermissions,getCommunityById,getAllCommunities,searchCommunities,getUserCommunities,joinCommunity,leaveCommunity,getCommunityMembers,removeMember,getUserCommunitiesByUserId}