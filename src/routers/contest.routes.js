import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import {cancelContest, changeContestPassword, createContest,
        deleteContest,
        getAllContest,
        getLeaderboard,
        joinedContests,
        leaveContest,
        updateContest,
        updateContestDuration,
        viewParticipants
    } from "../controllers/contest.controller.js";
import contestAuth from "../middleware/Authorisation/contest.middleware.js";


const router=Router()

router.route('/create').post(varifyJWt,createContest)
router.route('/delete/:contestId').delete(varifyJWt,contestAuth,deleteContest)
router.route('/update/details/:contestId').patch(varifyJWt,contestAuth,updateContest)
router.route('/getallcontest').get(getAllContest)
router.route('/cancle/:contestId').patch(varifyJWt,contestAuth,cancelContest)
router.route('/changepass/:contestId').patch(varifyJWt,contestAuth,changeContestPassword)
router.route('/join/:contestId').patch(varifyJWt,joinedContests)
router.route('/leave/:contestId').patch(varifyJWt,leaveContest)
router.route('/update/time/:contestId').patch(varifyJWt,contestAuth,updateContestDuration)
router.route('/participants/:contestId').get(varifyJWt,contestAuth,viewParticipants)
router.route('/rank/:contestId').get(getLeaderboard)
export default router