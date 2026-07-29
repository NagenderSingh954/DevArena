import { prisma } from "../../../lib/prisma";
import { ApiError } from "../../utils/ApiErro";
import { asyncHandler } from "../../utils/asyncHandler";

const problemAuth = asyncHandler(async (req, res, next) => {
    const { problemId } = req.params;

    if (!problemId?.trim()) {
        throw new ApiError(400, "Problem ID is required");
    }

    const problem = await prisma.problem.findUnique({
        where: {
            id: problemId
        }
    });

    if (!problem) {
        throw new ApiError(404, "Problem not found");
    }

    if (problem.contestId !== req.contest.id) {
        throw new ApiError(
            403,
            "This problem does not belong to the contest"
        );
    }

    req.problem = problem;

    next();
});

export default problemAuth