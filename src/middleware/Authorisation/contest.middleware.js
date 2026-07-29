import { prisma } from "../../../lib/prisma.js";
import { ApiError } from "../../utils/ApiErro.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


const contestAuth = asyncHandler(async (req, resizeBy, next) => {
    const { contestId } = req.params

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


    if (
        req.user.role !== "admin" &&
        contest.ownerId !== req.user.id
    ) {
        throw new ApiError(
            403,
            "You are not authorized to perform this action"
        );
    }
    req.contest = contest;
   
    next();
})

export default contestAuth