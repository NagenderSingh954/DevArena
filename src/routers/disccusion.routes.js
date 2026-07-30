import { Router } from "express";

import { createDiscussion, deleteDiscussion, getAllDiscussions, getDiscussionById, getDiscussionReplies, updateDiscussion } from "../controllers/discussion.controller.js";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { ownerAuth } from "../middleware/Authorisation/ownerAuth.middleware.js";


const router=Router()

router
    .route("/")
    .post(varifyJWt, createDiscussion)
    .get(getAllDiscussions);

router
    .route("/get/:discussionId")
    .get(getDiscussionById);

router
    .route("/update/:discussionId")
    .patch(
        varifyJWt,
        ownerAuth("discussion", "discussionId"),
        updateDiscussion
    );

router
    .route("/delete/:discussionId")
    .delete(
        varifyJWt,
        ownerAuth("discussion", "discussionId"),
        deleteDiscussion
    );

router
    .route("/get/:discussionId/replies")
    .get(getDiscussionReplies);

export default router