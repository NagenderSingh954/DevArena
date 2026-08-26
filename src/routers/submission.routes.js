import {Router} from "express";
import { runCode ,runBatch,getResults, executeRunCode, runAllTestCases} from "../controllers/submission.controller.js";
import { varifyJWt } from "../middleware/auth.middleware.js";

const router =Router();

router.post("/run", runCode);
// router.post("/batch", runBatch);
// router.post("/batch/results", getResults);
router.post('/:problemId/run',varifyJWt,executeRunCode)
router.post('/:contestId/:problemId/submit',varifyJWt,runAllTestCases)

export default router;