import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import contestAuth from "../middleware/Authorisation/contest.middleware.js";
import { createComment, deleteComment, getCommentById, getCommentReplies, getContestComment, updateComment } from "../controllers/comment.controller.js";
import { commentAuth } from "../middleware/Authorisation/comment.middleware.js";



const router=Router()

router.route('/:contestId').post(varifyJWt,contestAuth,createComment).get(getContestComment)
router.route('/delete/:commentId').delete(varifyJWt,commentAuth,deleteComment)
router.route('/update/:commentId').patch(varifyJWt,commentAuth,updateComment)

router.route('/get/:commentId').get(getCommentById)
router.route('/get/:commentId/replies').get(getCommentReplies)


export default router