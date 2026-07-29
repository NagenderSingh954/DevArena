import { Router } from "express";
import { addLanguagesToProblem, addPreloadedCode, addTestCases, createProblem, deleteProblem, getContestProblems, getPreloadedCode, getProblemById, getProblemLanguages, getProblemTestCases, updateProblem } from "../controllers/problem.controller.js";
import { varifyJWt } from "../middleware/auth.middleware.js";
import contestAuth from "../middleware/Authorisation/contest.middleware.js";
import problemAuth from "../middleware/Authorisation/problem.middleware.js";

const router=Router()

router.route('/create').post(varifyJWt,contestAuth,createProblem)
router.route('/update/:problemId').patch(varifyJWt,contestAuth,problemAuth,updateProblem)
router.route('/delete/:problemId').delete(varifyJWt,contestAuth,problemAuth,deleteProblem)
router.route('/add/l/:probleId').patch(varifyJWt,contestAuth,problemAuth,addLanguagesToProblem) // Language model need to prepare 
router.route('/add/t/:problemId').patch(varifyJWt,contestAuth,problemAuth,addTestCases)
router.route('/add/code/:problemId').patch(varifyJWt,contestAuth,problemAuth,addPreloadedCode)

router.route('/get/single/:problemId').get(getProblemById)

router.route('/get/contest/:contestId').get(getContestProblems)

router.route('/get/testcases/:problemId').get(getProblemTestCases)
router.route('/get/language/:problemId').get(getProblemLanguages)

router.route('/get/code/:problemId/:languageId').get(getPreloadedCode)




export default router