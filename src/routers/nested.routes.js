import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { createReply, deleteReply, getNestedReplies, updateReply } from "../controllers/nesstedcomment.controller.js";
import { ownerAuth } from "../middleware/Authorisation/ownerAuth.middleware.js";
// import isReplyOwner from "../middleware/Authorisation/nested.middleware.js";


const router=Router()

router.post("/comments/:commentId/replies", varifyJWt, createReply);

router.post("/discussions/:discussionId/replies", varifyJWt, createReply);

router.post("/replies/:replyId/replies", varifyJWt, createReply);

router.patch(
    "/replies/:replyId",
    varifyJWt,
    ownerAuth("nestedComment", "replyId"),
    updateReply
);
router.delete(
    "/replies/:replyId",
    varifyJWt,
    ownerAuth("nestedComment", "replyId"),
    deleteReply
);
router.get(
    "/replies/:replyId/replies",
    varifyJWt,
    getNestedReplies
);

export default router