import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { addCommunityMembers, getUserChats, getUserGroup, leaveCommunity, newGroup, removeMember } from "../controllers/chats/chat.controller.js";


const router = Router()

router.route('/new').post(varifyJWt,newGroup)
router.route('/mychats').get(varifyJWt,getUserChats)
router.route('/mygroups').get(varifyJWt,getUserGroup)
router.route('/add/members/:communityId').put(varifyJWt,addCommunityMembers)
router.route('/remove/members/:communityId').delete(varifyJWt,removeMember)
router.route('/leave/members/:communityId').delete(varifyJWt,leaveCommunity)

export default router