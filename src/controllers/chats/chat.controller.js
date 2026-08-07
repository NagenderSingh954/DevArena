import { emitEvent } from "../../utils/features.js";
import { ALERT, REFETCH_CHATS } from "../../constant/event.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiErro.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { prisma } from "../../../lib/prisma.js";

const newGroup = asyncHandler(async (req, res) => {
    const { name, description, avatar, members = [] } = req.body;
    const adminId = req.user.id;

    if (!name?.trim()) {
        throw new ApiError(400, "Community name is required");
    }
    if (!Array.isArray(members)) {
        throw new ApiError(400, "Members must be an array");
    }

    if (members.length < 2) {
        throw new ApiError(400, "A group must have at least 3 members including the admin");
    }


    const uniqueMembers = [...new Set(members)];
    if (!uniqueMembers.includes(adminId)) {
        uniqueMembers.push(adminId);
    }
    if (uniqueMembers.length < 3) {
        throw new ApiError(400, "A group must have at least 3 unique members including the admin");
    }

    const users = await prisma.user.findMany({
        where: {
            id: {
                in: uniqueMembers,
            },
        },
        select: {
            id: true,
        },
    });

    if (users.length !== uniqueMembers.length) {
        throw new ApiError(404, "One or more users do not exist");
    } //it is option giving just for the fulfilment of the group requiremnets 

    const community = await prisma.communitie.create({
        data: {
            name,
            description,
            avatar,
            isGroup: true,
            adminId,

            members: {
                create: uniqueMembers.map((userId) => ({
                    userId,
                })),
            },
        },
        include: {
            admin: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                },
            },
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                        },
                    },
                },
            },
        },
    });

    emitEvent(req, ALERT, uniqueMembers, `Welcome to ${name} group`);
    emitEvent(req, REFETCH_CHATS, members);  //these are the event that help the socket to emit the different event to the number of persons 
    return res.status(201).json(
        new ApiResponse(201, community, "group created successfully")
    );
});




const getUserChats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const chats = await prisma.communitie.findMany({
        where: {
            members: {
                some: {
                    userId,
                },
            },
        },
        select: {
            id: true,
            isGroup: true,
            name: true,
            description: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,

            admin: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                },
            },

            members: {
                select: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                        },
                    },
                },
            },

            messages: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 1,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    sender: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    const formattedChats = chats.map((chat) => {
        if (chat.isGroup) {
            return {
                id: chat.id,
                isGroup: true,
                name: chat.name,
                description: chat.description,
                avatar: chat.avatar,
                admin: chat.admin,
                members: chat.members,
                lastMessage: chat.messages[0] || null,
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
            };
        }

        const otherUser = chat.members.find(
            (member) => member.user.id !== userId
        )?.user;

        return {
            id: chat.id,
            isGroup: false,
            name: otherUser?.username || null,
            avatar: otherUser?.avatar || null,
            userId: otherUser?.id || null,
            lastMessage: chat.messages[0] || null,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
        };
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            formattedChats,
            "Chats fetched successfully."
        )
    );
});

const getUserGroup = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const myGroups = await prisma.communitie.findMany({
        where: {
            isGroup: true,
            adminId: userId
        },
        select: {
            id: true,
            isGroup: true,
            name: true,
            description: true,
            avatar: true,
            createdAt: true,
            updatedAt: true,

            messages: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 1,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    sender: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    members: true,
                },
            },
        },
        orderBy: {
            updatedAt: "desc",
        }
    })

    return res.status(200).json(
        new ApiResponse(200, myGroups, "User Groups Fetched Successfully")
    )
})


const addCommunityMembers = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const { members } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(members) || members.length === 0) {
        throw new ApiError(400, "Please provide at least one member.");
    }

    const community = await prisma.communitie.findUnique({
        where: {
            id: communityId,
        },
    });

    if (!community) {
        throw new ApiError(404, "Community not found.");
    }
    if (community.adminId !== userId) {
        throw new ApiError(403, "Only the admin can add members.");
    }

    const uniqueMembers = [...new Set(members)];

    // Check users exist
    const users = await prisma.user.findMany({
        where: {
            id: {
                in: uniqueMembers,
            },
        },
        select: {
            id: true,
        },
    });

    if (users.length !== uniqueMembers.length) {
        throw new ApiError(404, "One or more users do not exist.");
    }

    // Existing members
    const existingMembers = await prisma.communityMember.findMany({
        where: {
            communityId,
            userId: {
                in: uniqueMembers,
            },
        },
        select: {
            userId: true,
        },
    });

    const existingIds = new Set(existingMembers.map(member => member.userId));

    const newMembers = uniqueMembers.filter(
        id => !existingIds.has(id)
    );

    if (newMembers.length === 0) {
        throw new ApiError(400, "All selected users are already members.");
    }

    const newmembers = await prisma.communityMember.createMany({
        data: newMembers.map(userId => ({
            userId,
            communityId,
        })),
    });

    const newusers = await prisma.user.findMany({
        where: {
            id: {
                in: newMembers,
            },
        },
        select: {
            id: true,
            username: true,
        },
    });

    const usernames = newusers.map(user => user.username).join(", ");

    emitEvent(
        req,
        ALERT,
        newMembers,
        `${usernames} have been added to the group.`
    );


    emitEvent(req, REFETCH_CHATS, newMembers);

    return res.status(200).json(
        new ApiResponse(
            200,
            newusers,
            "Members added successfully."
        )
    );
});

const removeMember = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const { memberId } = req.body;
    const userId = req.user.id;

    if (!communityId || !memberId) {
        throw new ApiError(400, "Community ID and Member ID are required.");
    }
    const community = await prisma.communitie.findUnique({
        where: {
            id: communityId
        },
        select: {
            id: true,
            adminId: true,
            isGroup: true,
            _count: {
                select: {
                    members: true
                }
            }
        }
    })
    if (!community) {
        throw new ApiError(404, "Community not found.");
    }
    if (community.adminId !== userId) {
        throw new ApiError(400, "Only Admin can Remove the members")
    };
    if (community._count.members <= 3) {
        throw new ApiError(
            400,
            "A group must have at least 3 members."
        );
    }

    const existingMembers = await prisma.communityMember.findUnique({
        where: {
            userId_communityId: {
                userId: memberId,
                communityId,
            },
        },
        select: {
            userId: true,
            user: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                }
            },
        },
    });

    if (!existingMembers) {
        throw new ApiError(404, "User Is not the Member of the Community ")
    }
    if (community.adminId === memberId) {
        throw new ApiError(400, "Admin cannot be removed from the community.");
    }
    if (!community.isGroup) {
        throw new ApiError(400, "Cannot remove members from a private chat.");
    }



    await prisma.communityMember.delete({
        where: {
            userId_communityId: {
                communityId,
                userId: memberId
            }
        }
    })

    const remainingMembers = await prisma.communityMember.findMany({
        where: {
            communityId,
        },
        select: {
            userId: true,
        },
    });

    const allChatMembers = remainingMembers.map(member => member.userId);
    emitEvent(req, ALERT, remainingMembers.members, {
        message: `${existingMembers.user.username} has been removed from the group`,
        communityId,
    });


    emitEvent(req, REFETCH_CHATS, allChatMembers);

    return res.status(200).json(
        new ApiResponse(200, {}, "Member remove from the group ")
    )
})

const leaveCommunity = asyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.user.id;

    if (!communityId) {
        throw new ApiError(400, "Community ID is required.");
    }

    const community = await prisma.communitie.findUnique({
        where: {
            id: communityId,
        },
        select: {
            id: true,
            name: true,
            isGroup: true,
            adminId: true,
            members: {
                select: {
                    userId: true,
                },
            },
        },
    });

    if (!community) {
        throw new ApiError(404, "Community not found.");
    }

    if (!community.isGroup) {
        throw new ApiError(400, "Cannot leave a private chat.");
    }


    if (community.adminId === userId) {
        throw new ApiError(
            400,
            "Admin cannot leave the community. Transfer ownership or delete the community."
        );
    }


    const isMember = community.members.some(
        (member) => member.userId === userId
    );

    if (!isMember) {
        throw new ApiError(
            404,
            "User is not a member of the community."
        );
    }


    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            username: true,
            avatar: true,
        },
    });


    await prisma.communityMember.delete({
        where: {
            userId_communityId: {
                userId,
                communityId,
            },
        },
    });


    const remainingMembers = await prisma.communityMember.findMany({
        where: {
            communityId,
        },
        select: {
            userId: true,
        },
    });

    const allChatMembers = [
        ...remainingMembers.map((member) => member.userId),
        userId, // refresh chat list for the user who left
    ];


    emitEvent(
        req,
        ALERT,
        remainingMembers.map((member) => member.userId),
        {
            message: `${user.username} has left the group.`,
            communityId,
        }
    );

    // Refresh chats
    // emitEvent(req, REFETCH_CHATS, allChatMembers);

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "You left the community successfully."
        )
    );
});




export { newGroup, addCommunityMembers, getUserChats, getUserGroup, removeMember, leaveCommunity }