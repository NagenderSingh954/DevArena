import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { toggleCommentLike, toggleContestLike, toggleDiscussionLike, toggleNestedCommentLike } from "../controllers/like.controller.js";

const router=Router()


router.route('/c/:commentId').post(varifyJWt,toggleCommentLike)
router.route('/d/:discussionId').post(varifyJWt,toggleDiscussionLike)
router.route('/contest/:contestId').post(varifyJWt,toggleContestLike)
router.route('/nested/:commentId').post(varifyJWt,toggleNestedCommentLike)

export default router