import { emitEvent } from "../../utils/features.js";
import { ALERT, NEW_REQUEST, REFETCH_CHATS } from "../../constant/event.js";
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
    console.log(userId)
    console.log('isjdi')

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
});  // this will find the other persong name and detail 

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
})  // this will find the gropu name and detail 


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

const acceptChatRequest = asyncHandler(async (req, res) => {
    const { requestId, accept } = req.body; //accept must be Boolean 
    const searchRequest = await prisma.chatRequest.findUnique({
        where: {
            id: requestId
        }
    })
   
     if (!searchRequest) {
        throw new ApiError(404, "Chat request not found");
    }


    if (searchRequest.receiverId !== req.user.id) {
        throw new ApiError(401, "You are not authorised to Accept this request")
    }
     console.log(searchRequest.receiverId)
    if (!accept) {
        await prisma.chatRequest.delete({
            where: {
                id: requestId
            }
        })
        return res.status(200).json(
            new ApiResponse(200, {}, "Request Has Been Rejected Successfully")
        )
    }
    const chat = await prisma.communitie.create({
        data: {
            isGroup: false,
            members: {
                create: [
                    {
                        userId: searchRequest.receiverId
                    },
                    {
                        userId: searchRequest.senderId
                    }
                ]
            }
        },
       select: {
        id: true,

        members: {
            select: {
                id: true,
                communityId: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        fullName: true
                    }
                }
            }
        }
    }
    });

    const members = chat.members.map(member => member.userId);

    await prisma.chatRequest.delete({
            where: {
                id: requestId
            }
        })

    emitEvent(req,REFETCH_CHATS,members)

    return res.status(200).json(
            new ApiResponse(200, chat, "Request Has Been accepted Successfully")
        )
})

const sendRequest=asyncHandler(async(req,res)=>{
    const {userId}=req.body;

    if(!userId){
        throw new ApiError(404,"User Id not found");
    }
    const existing=await prisma.chatRequest.findFirst({
        where:{
            OR:[
                {receiverId:req.user.id,senderId:userId},
                {receiverId:userId,senderId:req.user.id}
            ]
        }
    })
    if(existing){
         throw new ApiError(400,"request alredy sended");
    }
    const request=await prisma.chatRequest.create({
        data:{
            senderId:req.user.id,
            receiverId:userId
        }
    })
    emitEvent(req, NEW_REQUEST, [userId]);
    
    return res.status(200).json(
        new ApiResponse(200,request,"Request sended successfully")
    )
})

const getMessages=asyncHandler(async(req,res)=>{
    const {communityId}=req.params;
    const {page=1}= req.query;
    const limit =20
    const skip=(page-1)*limit;

    const exist=await prisma.communitie.findUnique({
        where:{
            id:communityId
        }
    })

    if(!exist){
        throw new ApiError(404,"Community not found")
    }

    const [chat,totalChats]=await Promise.all([
        prisma.message.findMany({
            take:limit,
            skip:skip,
            where:{
                communityId:communityId
            },
            orderBy:{
                createdAt:"asc"
            }

        }),
        prisma.message.count({
            where:{
               communityId 
            }
        })
    ])

    return res.status(200).json(
        new ApiResponse(200,
            {
                chat,
                pagination:{
                    limit,
                    currentPage:page,
                    total:totalChats,
                    totalPage:Math.ceil(totalChats/limit)||0
                }
            }
        )
    )

})

const getCommunityDetails = asyncHandler(async (req, res) => {
  const { communityId } = req.params;

  if (req.query.populate === "true") {
    const community = await prisma.communitie.findUnique({
      where: {
        id: communityId,
      },
      include: {
        members: {
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
        },
      },
    });

    if (!community) {
      throw new ApiError(404, "Community not found");
    }

    return res.status(200).json({
      success: true,
      community,
    });
  }

  const community = await prisma.communitie.findUnique({
    where: {
      id: communityId,
    },
  });

  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  return res.status(200).json({
    success: true,
    community,
  });
});

const renameCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { name } = req.body;
  const userId = req.user.id;

  if (!communityId || !name?.trim()) {
    throw new ApiError(400, "Community ID and name are required.");
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
    throw new ApiError(400, "This community is not a group.");
  }

  if (community.adminId !== userId) {
    throw new ApiError(
      403,
      "Only the group admin can rename the group."
    );
  }

  const updatedCommunity = await prisma.communitie.update({
    where: {
      id: communityId,
    },
    data: {
      name: name.trim(),
    },
    select: {
      id: true,
      name: true,
      description: true,
      avatar: true,
      isGroup: true,
      adminId: true,
      updatedAt: true,
    },
  });

  // Get only user IDs
  const memberIds = community.members.map((member) => member.userId);

  emitEvent(req, REFETCH_CHATS, memberIds);

  return res.status(200).json({
    success: true,
    message: "Group renamed successfully.",
    community: updatedCommunity,
  });
});

const deleteCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user.id;

  if (!communityId) {
    throw new ApiError(400, "Community ID is required.");
  }

  // Get community + members before deleting
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

  // Only groups can be deleted using this function
  if (!community.isGroup) {
    throw new ApiError(400, "Only group chats can be deleted.");
  }

  // Only admin can delete the group
  if (community.adminId !== userId) {
    throw new ApiError(
      403,
      "Only the group admin can delete the group."
    );
  }

  // Keep member IDs because community will be deleted
  const members = community.members.map(
    (member) => member.userId
  );

  await prisma.$transaction(async (tx) => {
    // Delete messages belonging to this community
    await tx.message.deleteMany({
      where: {
        communityId: communityId,
      },
    });

    // Delete community members
    await tx.communityMember.deleteMany({
      where: {
        communityId: communityId,
      },
    });

    // Finally delete the community
    await tx.communitie.delete({
      where: {
        id: communityId,
      },
    });
  });

  // Tell all members to refetch their chats
  emitEvent(req, REFETCH_CHATS, members);

  return res.status(200).json({
    success: true,
    message: "Group deleted successfully.",
  });
});

export { newGroup, addCommunityMembers, getUserChats, getUserGroup, removeMember, leaveCommunity,acceptChatRequest,sendRequest,getMessages,getCommunityDetails,renameCommunity,deleteCommunity}