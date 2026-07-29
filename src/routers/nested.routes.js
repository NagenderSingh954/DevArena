import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { createReply, deleteReply, getNestedReplies, updateReply } from "../controllers/nesstedcomment.controller.js";
import isReplyOwner from "../middleware/Authorisation/nested.middleware.js";


const router=Router()

router.post("/comments/:commentId/replies", varifyJWt, createReply);

router.post("/discussions/:discussionId/replies", verifyJWT, createReply);

router.post("/replies/:replyId/replies", varifyJWt, createReply);

router.patch(
    "/replies/:replyId",
    varifyJWt,
    isReplyOwner,
    updateReply
);
router.delete(
    "/replies/:replyId",
    varifyJWt,
    isReplyOwner,
    deleteReply
);
router.get(
    "/replies/:replyId/replies",
    varifyJWt,
    getNestedReplies
);

export default router