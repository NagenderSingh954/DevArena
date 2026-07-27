import {prisma} from '../../lib/prisma.js'
import { ApiError } from '../utils/ApiErro.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
//Join Contest,Leave Contest,Add/Remove Problems,Reset Password,Extend/Shorten Duration,View Participants,Leaderboard,Export Results,Invite Participants,

const createContest=asyncHandler(async(req,res)=>{
    const {title,description,contentType,visibility,startingFrom,endingAt,totalPoints,password,isProtected,languages}=req.body
   // String validations
if ([title, description, contentType, visibility].some(field => !field?.trim())) {
    throw new ApiError(400, "All required fields must be provided");
}

// Date validations
if (!startingFrom || !endingAt) {
    throw new ApiError(400, "Starting and ending time are required");
}

const start = new Date(startingFrom);
const end = new Date(endingAt);

if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid date format");
}

if (start >= end) {
    throw new ApiError(400, "Ending time must be after starting time");
}

// Total points
if (totalPoints == null || Number(totalPoints) <= 0) {
    throw new ApiError(400, "Total points must be greater than 0");
}

// Boolean validation
if (typeof isProtected !== "boolean") {
    throw new ApiError(400, "isProtected must be a boolean");
}

// Password validation
if (isProtected && !password?.trim()) {
    throw new ApiError(400, "Password is required for protected contests");
}

// Languages validation (assuming String[])
if (!Array.isArray(languages) || languages.length === 0) {
    throw new ApiError(400, "Select at least one language");
}

if (languages.some(lang => typeof lang !== "string" || !lang.trim())) {
    throw new ApiError(400, "Invalid language list");
}
if (!["public", "private"].includes(visibility)) {
    throw new ApiError(400, "Invalid visibility");
}

    const contest=await prisma.contest.create({
        data:{
            ownerId:req.user?.id,
            title: title.trim(),
description: description.trim(),
contentType: contentType.trim(),
            visibility,
            startingFrom: start,
endingAt: end,
           totalPoints: Number(totalPoints),
            isProtected,
           languages: languages.map(lang => lang.trim()),
            password: isProtected ? password : null,
        }
    })
    // if(!contest){
    //     throw new ApiError(500,"Error while creating the contest")
    // }

    return res.status(201).json(
        new ApiResponse(201,contest,"Contest creted Successfully ")
    )
})

const deleteContest = asyncHandler(async (req, res) => {
    const { contestId } = req.params;

    if (!contestId?.trim()) {
        throw new ApiError(400, "Contest ID is required");
    }

    const contest = await prisma.contest.findUnique({
        where: {
            id: contestId
        }
    });

    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    if (contest.ownerId !== req.user.id || req.user?.role !== "admin") {
        throw new ApiError(403, "Unauthorized access");
    }

    await prisma.contest.delete({
        where: {
            id: contestId
        }
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Contest deleted successfully")
    );
});

const updateContest = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const { title, description, visibility, languages } = req.body;

    if (!contestId?.trim()) {
        throw new ApiError(400, "Contest ID is required");
    }

    const contest = await prisma.contest.findUnique({
        where: {
            id: contestId
        }
    });

    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    if (contest.ownerId !== req.user.id) {
        throw new ApiError(403, "Unauthorized access");
    }

    const updatedData = {};


    if (title !== undefined) {
        if (!title.trim()) {
            throw new ApiError(400, "Title cannot be empty");
        }
        updatedData.title = title.trim();
    }


    if (description !== undefined) {
        if (!description.trim()) {
            throw new ApiError(400, "Description cannot be empty");
        }
        updatedData.description = description.trim();
    }

  
    if (visibility !== undefined) {
        if (!["public", "private"].includes(visibility)) {
            throw new ApiError(400, "Invalid visibility");
        }
        updatedData.visibility = visibility;
    }


    if (languages !== undefined) {
        if (
            !Array.isArray(languages) ||
            languages.length === 0 ||
            languages.some(lang => typeof lang !== "string" || !lang.trim())
        ) {
            throw new ApiError(400, "Invalid languages");
        }

        updatedData.languages = [
            ...new Set(languages.map(lang => lang.trim()))
        ];
    }

    const updatedContest = await prisma.contest.update({
        where: {
            id: contestId
        },
        data: updatedData
    });

    return res.status(200).json(
        new ApiResponse(200, updatedContest, "Contest updated successfully")
    );
});
const cancelContest = asyncHandler(async (req, res) => {
    const { contestId } = req.params;

    if (!contestId?.trim()) {
        throw new ApiError(400, "Contest ID is required");
    }

    const contest = await prisma.contest.findUnique({
        where: {
            id: contestId
        }
    });

    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    if (contest.ownerId !== req.user.id) {
        throw new ApiError(403, "Unauthorized access");
    }

    if (contest.isCancelled) {
        throw new ApiError(400, "Contest is already cancelled");
    }

    const cancelledContest = await prisma.contest.update({
        where: {
            id: contestId
        },
        data: {
            isCancelled: true
        }
    });

    return res.status(200).json(
        new ApiResponse(200, cancelledContest, "Contest cancelled successfully")
    );
});

const getAllContest = asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 15;
    const skip = (page - 1) * limit;

    // Only i am teh boss who can controll the Contest
    const where =
        req.user?.role === "admin"
            ? {}
            : { isCancelled: false };

    const [contests, totalContests] = await Promise.all([
        prisma.contest.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                title: true,
                description: true,
                visibility: true,
                languages: true,
                totalPoints: true,
                startingFrom: true,
                endingAt: true,
                isCancelled: true,
                createdAt: true,
                owner: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        participants: true,
                        problems: true
                    }
                }
            }
        }),

        prisma.contest.count({
            where
        })
    ]);

    const now = new Date();

    const contestsWithStatus = contests.map((contest) => {
        let status;

        if (contest.isCancelled) {
            status = "CANCELLED";
        } else if (now < contest.startingFrom) {
            status = "UPCOMING";
        } else if (now > contest.endingAt) {
            status = "ENDED";
        } else {
            status = "ONGOING";
        }

        return {
            ...contest,
            status
        };
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                contests: contestsWithStatus,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalContests / limit),
                    totalContests,
                    hasNextPage: page < Math.ceil(totalContests / limit),
                    hasPreviousPage: page > 1
                }
            },
            "Contests fetched successfully"
        )
    );
});

const changeContestPassword = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const { password } = req.body;

    if (!contestId?.trim()) {
        throw new ApiError(400, "Contest ID is required");
    }

    if (!password?.trim()) {
        throw new ApiError(400, "New password is required");
    }

    const contest = await prisma.contest.findUnique({
        where: {
            id: contestId
        }
    });

    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    const isOwner = contest.ownerId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
        throw new ApiError(403, "Unauthorized access");
    }

    const updatedContest = await prisma.contest.update({
        where: {
            id: contestId
        },
        data: {
            password: password.trim(),
            isProtected: true
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedContest,
            "Contest password updated successfully"
        )
    );
});