import { prisma } from "../../lib/prisma.js";
import { submitBatch, submitCode, getBatchResults } from "../services/execution/judge0.service.js";
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const runCode = async (req, res) => {
    try {
        const {
            languageId,
            code,
            stdin = "",
        } = req.body;

        if (!languageId) {
            return res.status(400).json({
                success: false,
                message: "languageId is required",
            });
        }

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "code is required",
            });
        }

        const result = await submitCode({
            languageId,
            sourceCode: code,
            stdin,
        });

        return res.status(200).json({
            success: true,
            result,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const runBatch = async (submissions) => {
    try {
        // const { submissions } = req.body;

        if (!submissions || !Array.isArray(submissions)) {
            throw new ApiError(400, "provide Testcases in batch")
        }

        if (submissions.length === 0) {
            throw new ApiError(400, "submissions cannot be empty")
        }

        const results = await submitBatch(submissions);


        return results;
    } catch (error) {
        console.error("Batch execution error:", error);

        throw new ApiError(400, error.message)
    }
};
const getResults = async (tokens) => {
    try {
        if (!tokens || !Array.isArray(tokens)) {
            throw new ApiError(400, "tokens array is required")
        }
        const results = await getBatchResults(tokens);
    
        return results?.submissions;
    } catch (error) {
        console.error("Get batch results error:", error);
        throw new ApiError(400, error.message)
    }
};

const languageMap = {
    cpp: 54,
    java: 62,
    python: 71,
    javascript: 63
};

const executeRunCode = asyncHandler(async (req, res) => {

    //user provide the problem id and language and code 
    //find the proble and take 3 testcase from the problem
    //now map the language with the judge0 langugae id's  
    // now give the user code to the jusgde0 in batch and they will provide the token 
    // now store the token in array and give jugde 0 token again and check the success rate 
    // now put the result in teh array with the testcase whether are pass or not 
    //    and forward this to the frontend

    const { problemId } = req.params;
    const { languageId, sourceCode } = req.body;
    if ([languageId, sourceCode].some(e => e.trim() == '')) {
        throw new ApiError(404, "Require Fields Are Missiong")
    }
    const problem = await prisma.problem.findUnique({
        where: {
            id: problemId
        }
    });
    if (!problem) {
        throw new ApiError(404, "Please Provide Valid Problem Id ")
    };
    const testcases = await prisma.testCase.findMany({
        where: {
            problemId
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 3
    });
    if (testcases.length === 0) {
        throw new ApiError(
            404,
            "There are no testcases available for this problem"
        );
    }
    const judge0LanguageId = languageMap[languageId]
    if (!judge0LanguageId) {
        throw new ApiError(400, "Invalid language");
    }
    const submissionCode = testcases.map((test) => ({
        language_id: judge0LanguageId,
        source_code: sourceCode,
        stdin: test.input
    }))

    const tokens = await runBatch(submissionCode)


    if (!tokens || tokens.length !== testcases.length) {
        throw new ApiError(
            500,
            "Failed to create Judge0 submissions"
        );
    }

    const tokenArray = tokens.map((t) => t.token)

    const judge0output = await getResults(tokenArray)
    const results = judge0output.map((output, index) => {
        const expectedOutput = testcases[index].output
            .trim().replace(/\r\n/g, "\n");

        const actualOutput = (output.stdout || "")
            .trim()
            .replace(/\r\n/g, "\n");

        const passed = output.status?.id == 3 && actualOutput == expectedOutput

        return {
            testcase: index + 1,
            passed,
            input: testcases[index].input,
            expectedOutput,
            actualOutput,
            status: output.status?.description || "Unknown",
            time: output.time,
            memory: output.memory
        };


    });

    const passedCount = results.filter(
        (result) => result.passed
    ).length;
    const totalTestCases = results.length;

    return res.status(200).json(
        new ApiResponse(200, {
            passed: passedCount,
            total: totalTestCases,
            allPassed: passedCount === totalTestCases,
            results

        }, passedCount === totalTestCases
            ? "All testcases passed"
            : "Some testcases failed")
    )




})


const runAllTestCases = asyncHandler(async (req, res) => {

    //user provide the problem id and language and code 
    //find the proble and take 3 testcase from the problem
    //now map the language with the judge0 langugae id's  
    // now give the user code to the jusgde0 in batch and they will provide the token 
    // now store the token in array and give jugde 0 token again and check the success rate 
    // now put the result in teh array with the testcase whether are pass or not 
    //    and forward this to the frontend

    const { problemId, contestId } = req.params;
    const { languageId, sourceCode } = req.body;
    if ([languageId, sourceCode].some(e => e.trim() == '')) {
        throw new ApiError(404, "Require Fields Are Missiong")
    }
    const problem = await prisma.problem.findUnique({
        where: {
            id: problemId
        }
    });
    if (!problem) {
        throw new ApiError(404, "Please Provide Valid Problem Id ")
    };
    const testcases = await prisma.testCase.findMany({
        where: {
            problemId
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    if (testcases.length === 0) {
        throw new ApiError(
            404,
            "There are no testcases available for this problem"
        );
    }
    const judge0LanguageId = languageMap[languageId]
    if (!judge0LanguageId) {
        throw new ApiError(400, "Invalid language");
    }
    const submissionCode = testcases.map((test) => ({
        language_id: judge0LanguageId,
        source_code: sourceCode,
        stdin: test.input
    }))

    const tokens = await runBatch(submissionCode)

    if (!tokens || tokens.length !== testcases.length) {
        throw new ApiError(
            500,
            "Failed to create Judge0 submissions"
        );
    }

    const tokenArray = tokens.map((t) => t.token)

    const judge0output = await getResults(tokenArray)
    const results = judge0output.map((output, index) => {
        const expectedOutput = testcases[index].output
            .trim().replace(/\r\n/g, "\n");

        const actualOutput = (output.stdout || "")
            .trim()
            .replace(/\r\n/g, "\n");

        const passed = output.status?.id == 3 && actualOutput == expectedOutput

        return {
            testcase: index + 1,
            passed,
            input: testcases[index].input,
            expectedOutput,
            actualOutput,
            status: output.status?.description || "Unknown",
            time: output.time,
            memory: output.memory
        };


    });

    const passedCount = results.filter(
        (result) => result.passed
    ).length;
    const totalTestCases = results.length;

    if (passedCount == totalTestCases) {
        const submitingInDB = await prisma.submittedCode.create({
            data: {
                code: sourceCode,
                submissionerId: req.user?.id,
                problemId,
                contestId,
                languageId,
                passedTestCases: passedCount,
                totalTestCases
            }
        })
    }

    return res.status(200).json(
        new ApiResponse(200, {
            passed: passedCount,
            total: totalTestCases,
            allPassed: passedCount === totalTestCases,
            results

        }, passedCount === totalTestCases
            ? "All testcases passed"
            : "Some testcases failed")
    )




})


export { runCode, runBatch, getResults, executeRunCode, runAllTestCases }