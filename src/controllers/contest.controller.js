import {prisma} from '../../lib/prisma.js'
import { ApiError } from '../utils/ApiErro.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
//Export Results,Invite Participants,

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
   const contest=req.contest
    await prisma.contest.delete({
        where: {
            id: contest.id
        }
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Contest deleted successfully")
    );
});

const updateContest = asyncHandler(async (req, res) => {
    const contest = req.contest;
    const { title, description, visibility, languages } = req.body;

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
            id: contest.id
        },
        data: updatedData
    });

    return res.status(200).json(
        new ApiResponse(200, updatedContest, "Contest updated successfully")
    );
});

const getAllContest = asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 15;
    const skip = (page - 1) * limit;

    const [contests, totalContests] = await Promise.all([
        prisma.contest.findMany({
            where:{
                isCancelled:false
            },
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
    where: {
        isCancelled: false
    }
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
const cancelContest=asyncHandler(async(req,res)=>{
    const contest=req.contest
    if(contest.isCancelled){
        throw new ApiError(400,"Contest is alredy cancelled")
    }
     const cancelledContest = await prisma.contest.update({
        where: {
            id: contest.id
        },
        data: {
            isCancelled: true
        }
    });

    return res.status(200).json(
        new ApiResponse(200, cancelledContest, "Contest cancelled successfully")
    );


})
const changeContestPassword=asyncHandler(async(req,res)=>{
    const contest=req.contest
    const { password } = req.body;
    if(!contest.isProtected){
        throw new ApiError(400,"Contest is don't have Any password")
    }
    if(!password?.trim()){
         throw new ApiError(400,"please provide teh contest password")
    }

    const newContest=await prisma.contest.update({
        where:{
            id:contest.id
        },
        data:{
            password:password.trim()
        }
    })
    if(!newContest){
        throw new ApiError(500,"Error while updating the pass")
    }

    return res.status(201).json(
        new ApiResponse(201,newContest,"Password updated Successfully ")
    )

})

const joinedContests=asyncHandler(async(req,res)=>{
    const {contestId}=req.params;
    if(!contestId){
        throw new ApiError(400,"Please provide the valid ID's")
    }
    const contest =await prisma.contest.findUnique({
        where:{
            id:contestId
        },
         include: { participants: true },
    })

    if(!contest){
        throw new ApiError(500,"There is Issue while fetching the contest ")
    }
    const alredyexist = contest.participants.some((user)=>(
        user.id=== req.user
    ))
    if (alredyexist) {
        throw new ApiError(409,"User alredy join the contest ")
}

    const addparticipant=await prisma.contest.update({
         where:{
            id:contestId
        },
        data:{
            participants:{
                connect:{
                    id:req.user.id
                }
            }
        }
    })

    return res.status(200).json(
        new ApiResponse(200,addparticipant,"User Joing the contest ")
    )



})
const leaveContest = asyncHandler(async (req, res) => {
    const { contestId } = req.params;

    if (!contestId?.trim()) {
        throw new ApiError(400, "Please provide a valid contest ID");
    }

    const contest = await prisma.contest.findUnique({
        where: {
            id: contestId
        },
        include: {
            participants: {
                select: {
                    id: true
                }
            }
        }
    });

    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    const isParticipant = contest.participants.some(
        (user) => user.id === req.user.id
    );

    if (!isParticipant) {
        throw new ApiError(400, "You have not joined this contest");
    }

    const updatedContest = await prisma.contest.update({
        where: {
            id: contestId
        },
        data: {
            participants: {
                disconnect: {
                    id: req.user.id
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedContest,
            "Contest left successfully"
        )
    );
});

const updateContestDuration = asyncHandler(async (req, res) => {
    const contest = req.contest;
    const { startingFrom, endingAt } = req.body;

    if (!startingFrom && !endingAt) {
        throw new ApiError(
            400,
            "Please provide startingFrom or endingAt"
        );
    }

    if (contest.isCancelled) {
        throw new ApiError(
            400,
            "Cannot modify a cancelled contest"
        );
    }

    const updateData = {};

    const start = startingFrom
        ? new Date(startingFrom)
        : contest.startingFrom;

    const end = endingAt
        ? new Date(endingAt)
        : contest.endingAt;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ApiError(400, "Invalid date");
    }

    if (start >= end) {
        throw new ApiError(
            400,
            "Ending time must be after starting time"
        );
    }

    updateData.startingFrom = start;
    updateData.endingAt = end;

    const updatedContest = await prisma.contest.update({
        where: {
            id: contest.id
        },
        data: updateData
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedContest,
            "Contest duration updated successfully"
        )
    );
});
const viewParticipants = asyncHandler(async (req, res) => {
    const participants = await prisma.contest.findUnique({
        where: {
            id: req.contest.id
        },
        select: {
            id: true,
            title: true,
            participants: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                    email: true,
                    createdAt: true
                }
            },
            _count: {
                select: {
                    participants: true
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            participants,
            "Participants fetched successfully"
        )
    );
});

const getLeaderboard = asyncHandler(async (req, res) => {
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

    const submissions = await prisma.submittedCode.findMany({
        where: {
            contestId
        },
        orderBy: {
            createdAt: "asc"
        },
        include: {
            submissioner: {
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true
                }
            }
        }
    });

    const seen = new Set();
    const leaderboard = [];

    for (const submission of submissions) {
        if (!seen.has(submission.submissionerId)) {
            seen.add(submission.submissionerId);

            leaderboard.push({
                rank: leaderboard.length + 1,
                submittedAt: submission.createdAt,
                user: submission.submissioner
            });
        }
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            leaderboard,
            "Leaderboard fetched successfully"
        )
    );
});

export {
    createContest,deleteContest,updateContest,getAllContest,cancelContest,changeContestPassword,joinedContests,leaveContest,updateContestDuration,viewParticipants,getLeaderboard
}