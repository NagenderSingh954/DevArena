import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { communityadminAuth } from "../middleware/Authorisation/communityAuth.js";
import { createCommunity, 
         deleteCommunity, 
         getAllCommunities, 
         getCommunityById, 
         getCommunityMembers, 
         getUserCommunities, 
         getUserCommunitiesByUserId, 
         joinCommunity, 
         leaveCommunity, 
         removeMember, 
         searchCommunities, 
         updateCommunity,
         updateCommunityPermissions } from "../controllers/community.controller.js";

const router = Router()
router.route("/")
    .post(varifyJWt, createCommunity)
    .get(getAllCommunities);

router.route("/search")
    .get(searchCommunities);

router.route("/my")
    .get(varifyJWt, getUserCommunities);

router.route("/user/:userId")
    .get(getUserCommunitiesByUserId);

router.route("/:communityId")
    .get(getCommunityById)
    .patch(varifyJWt, communityadminAuth, updateCommunity)
    .delete(varifyJWt, communityadminAuth, deleteCommunity);

router.route("/:communityId/permissions")
    .patch(varifyJWt, communityadminAuth, updateCommunityPermissions);

router.route("/:communityId/join")
    .post(varifyJWt, joinCommunity);

router.route("/:communityId/leave")
    .delete(varifyJWt, leaveCommunity);

router.route("/:communityId/members")
    .get(getCommunityMembers);

router.route("/:communityId/members/:userId")
    .delete(varifyJWt, communityadminAuth, removeMember);

export default router