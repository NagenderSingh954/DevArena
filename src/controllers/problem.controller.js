import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// CRUD

// createProblem        dsf
// updateProblem            ffg
// deleteProblem            fc
// getProblemById               ddsf
// getContestProblems   xcfg

// Language Management

// addLanguagesToProblem        cvg
// getProblemLanguages           fgx

// Test Case Management

// addTestCase              dzs
// updateTestCase
// deleteTestCase
// getProblemTestCases      sdas

// Preloaded/Buggy Code

// addPreloadedCode         as
// updatePreloadedCode
// deletePreloadedCode
// getPreloadedCode         dfd

const createProblem = asyncHandler(async (req, res) => {
    const contest = req.contest;

    const {
        title,
        statement,
        difficulty,
        tags,
        constraints
    } = req.body;

   if (
    [title, statement].some(field => !field?.trim()) ||
    !Array.isArray(constraints) ||
    constraints.length === 0
) {
    throw new ApiError(400, "All fields are required");
}
    const problem = await prisma.problem.create({
        data: {
            contestId: contest.id,
            title,
            statement,
            difficulty,
            tags,
            constraints
        }
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            problem,
            "Problem created successfully"
        )
    );
});     //require contestAuth


const updateProblem = asyncHandler(async (req, res) => {
    const {
        title,
        statement,
        difficulty,
        tags,
        constrians
    } = req.body;

    const updateData = {};

    if (title !== undefined) {
        if (!title.trim()) {
            throw new ApiError(400, "Title cannot be empty");
        }
        updateData.title = title.trim();
    }

    if (statement !== undefined) {
        if (!statement.trim()) {
            throw new ApiError(400, "Statement cannot be empty");
        }
        updateData.statement = statement.trim();
    }

    if (constrians !== undefined) {
        if (!constrians.trim()) {
            throw new ApiError(400, "Constraints cannot be empty");
        }
        updateData.constrians = constrians.trim();
    }

    if (difficulty !== undefined) {
        const validDifficulties = ["easy", "medium", "hard"];

        if (!validDifficulties.includes(difficulty)) {
            throw new ApiError(400, "Invalid difficulty");
        }

        updateData.difficulty = difficulty;
    }

    if (
        !Array.isArray(tags) ||
        tags.some(tag => typeof tag !== "string" || !tag.trim())
    ) {
        throw new ApiError(
            400,
            "Tags must be a non-empty string array"
        );
    }

    updateData.tags = tags.map(tag => tag.trim());

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "Please provide at least one field to update");
    }

    const updatedProblem = await prisma.problem.update({
        where: {
            id: req.problem.id
        },
        data: updateData
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedProblem,
            "Problem updated successfully"
        )
    );
});

const deleteProblem = asyncHandler(async (req, res) => {
    if (new Date() >= req.contest.startingFrom) {
        throw new ApiError(
            400,
            "Cannot delete a problem after the contest has started"
        );
    }
    const submissionCount = await prisma.submittedCode.count({
        where: {
            problemId: req.problem.id
        }
    });

    if (submissionCount > 0) {
        throw new ApiError(
            400,
            "Cannot delete a problem that has submissions"
        );
    }

    await prisma.problem.delete({
        where: {
            id: req.problem.id
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Problem deleted successfully"
        )
    );
});
const addLanguagesToProblem = asyncHandler(async (req, res) => {
    const { languageIds } = req.body;

    if (!Array.isArray(languageIds) || languageIds.length === 0) {
        throw new ApiError(400, "Please provide at least one language");
    }

    const uniqueLanguageIds = [...new Set(languageIds)];

    const languages = await prisma.language.findMany({
        where: {
            id: {
                in: uniqueLanguageIds
            }
        },
        select: {
            id: true
        }
    });

    if (languages.length !== uniqueLanguageIds.length) {
        throw new ApiError(404, "One or more selected languages do not exist");
    }

    const updatedProblem = await prisma.problem.update({
        where: {
            id: req.problem.id
        },
        data: {
            language: {
                connect: languages.map(language => ({
                    id: language.id
                }))
            }
        },
        include: {
            language: {
                select: {
                    id: true,
                    lang: true,
                    image: true
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedProblem,
            "Languages added successfully"
        )
    );
});

// const addTestCase = asyncHandler(async (req, res) => {
//     const { input, output } = req.body;

//     if (
//         [input, output].some(
//             (field) => typeof field !== "string" || !field.trim()
//         )
//     ) {
//         throw new ApiError(400, "Input and output are required");
//     }

//     const testCase = await prisma.testCase.create({
//         data: {
//             problemId: req.problem.id,
//             input: input.trim(),
//             output: output.trim()
//         }
//     });

//     return res.status(201).json(
//         new ApiResponse(
//             201,
//             testCase,
//             "Test case added successfully"
//         )
//     );
// });

const addTestCases = asyncHandler(async (req, res) => {
    const { testCases } = req.body;

    if (!Array.isArray(testCases) || testCases.length === 0) {
        throw new ApiError(400, "Please provide at least one test case");
    }

    const data = testCases.map((testCase) => {
        if (
            typeof testCase.input !== "string" ||
            !testCase.input.trim() ||
            typeof testCase.output !== "string" ||
            !testCase.output.trim()
        ) {
            throw new ApiError(
                400,
                "Each test case must have valid input and output"
            );
        }

        return {
            problemId: req.problem.id,
            input: testCase.input.trim(),
            output: testCase.output.trim()
        };
    });

    const createdTestCases = await prisma.testCase.createManyAndReturn({
    data,
});

    return res.status(201).json(
        new ApiResponse(
            201,
            createdTestCases,
            "Test cases added successfully"
        )
    );
});

const getProblemById = asyncHandler(async (req, res) => {
    const { problemId } = req.params;

    if (!problemId?.trim()) {
        throw new ApiError(400, "Problem ID is required");
    }

    const problem = await prisma.problem.findUnique({
        where: {
            id: problemId
        },
        include: {
            language: {
                select: {
                    id: true,
                    lang: true,
                    image: true
                }
            },
            testCases:{
                select:{
                    input:true,
                    output:true
                }
            },
            preloadedcode:{
                select:{languageId:true,
                code:true}
            }
        }
    });

    if (!problem) {
        throw new ApiError(404, "Problem not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            problem,
            "Problem fetched successfully"
        )
    );
}); //adding the testcase in this 

const getContestProblems = asyncHandler(async (req, res) => {
    const { contestId } = req.params;

    if (!contestId?.trim()) {
        throw new ApiError(400, "Contest ID is required");
    }

    const problems = await prisma.problem.findMany({
        where: {
            contestId
        },
        select: {
            id: true,
            title: true,
            difficulty: true,
            tags: true,
            createdAt: true,
            language: {
                select: {
                    id: true,
                    lang: true
                }
            }
        },
        orderBy: {
            createdAt: "asc"
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            problems,
            "Problems fetched successfully"
        )
    );
});

const getProblemTestCases = asyncHandler(async (req, res) => {
    const { problemId } = req.params;

    if (!problemId?.trim()) {
        throw new ApiError(400, "Problem ID is required");
    }

    const testCases = await prisma.testCase.findMany({
        where: {
            problemId
        },
        select: {
            id: true,
            input: true,
            output: true
        },
        orderBy: {
            createdAt: "asc"
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            testCases,
            "Test cases fetched successfully"
        )
    );
});

const getProblemLanguages = asyncHandler(async (req, res) => {
    const { problemId } = req.params;

    if (!problemId?.trim()) {
        throw new ApiError(400, "Problem ID is required");
    }

    const problem = await prisma.problem.findUnique({
        where: {
            id: problemId
        },
        select: {
            language: {
                select: {
                    id: true,
                    lang: true,
                    image: true
                }
            }
        }
    });

    if (!problem) {
        throw new ApiError(404, "Problem not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            problem.language,
            "Problem languages fetched successfully"
        )
    );
});
const addPreloadedCode = asyncHandler(async (req, res) => {
    const { languageId, code } = req.body;

    if (!languageId?.trim() || !code?.trim()) {
        throw new ApiError(400, "Language and code are required");
    }

    const problem = await prisma.problem.findUnique({
        where: {
            id: req.problem.id
        },
        select: {
            language: {
                where: {
                    id: languageId
                },
                select: {
                    id: true
                }
            }
        }
    });

    if (problem.language.length === 0) {
        throw new ApiError(
            400,
            "Selected language is not allowed for this problem"
        );
    }


    const existingCode = await prisma.buggyCode.findFirst({
        where: {
            problemId: req.problem.id,
            languageId
        }
    });

    if (existingCode) {
        throw new ApiError(
            409,
            "Starter code already exists for this language"
        );
    }

    const preloadedCode = await prisma.buggyCode.create({
        data: {
            problemId: req.problem.id,
            languageId,
            code: code.trim()
        },
        include: {
            language: {
                select: {
                    id: true,
                    lang: true,
                    image: true
                }
            }
        }
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            preloadedCode,
            "Starter code added successfully"
        )
    );
});

const getPreloadedCode = asyncHandler(async (req, res) => {
    const { problemId, languageId } = req.params;

    if (!problemId?.trim() || !languageId?.trim()) {
        throw new ApiError(400, "Problem ID and Language ID are required");
    }

    const preloadedCode = await prisma.buggyCode.findUnique({
        where: {
            problemId_languageId: {
                problemId,
                languageId
            }
        },
        include: {
            language: {
                select: {
                    id: true,
                    lang: true,
                    image: true
                }
            }
        }
    });

    if (!preloadedCode) {
        throw new ApiError(
            404,
            "Starter code not found for the selected language"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            preloadedCode,
            "Starter code fetched successfully"
        )
    );
});


export {
    createProblem,updateProblem,deleteProblem,addLanguagesToProblem,addPreloadedCode,addTestCases,getContestProblems,getPreloadedCode,getProblemById,getProblemLanguages,getProblemTestCases,
}