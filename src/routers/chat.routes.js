import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { acceptChatRequest, addCommunityMembers, deleteCommunity, deletePersonalChat, getCommunityDetails, getMessages, getUserChats, getUserGroup, leaveCommunity, newGroup, removeMember, renameCommunity, sendRequest } from "../controllers/chats/chat.controller.js";


const router = Router()

// Community
router.route("/")
  .post(varifyJWt, newGroup);// done testing 

router.route("/my")
  .get(varifyJWt, getUserGroup); //done 


// Chats
router.route("/chats")
  .get(varifyJWt, getUserChats);  //done

router.route("/:communityId")
  .get(varifyJWt, getCommunityDetails)
  .patch(varifyJWt, renameCommunity)
  .delete(varifyJWt, deleteCommunity);  //done

router.route("/delete/:communityId")
    .delete(varifyJWt, deletePersonalChat);
// Community members
router.route("/:communityId/members")
  .put(varifyJWt, addCommunityMembers)
  .delete(varifyJWt, removeMember);   //done 

router.route("/:communityId/leave")
  .delete(varifyJWt, leaveCommunity); //done


// Messages
router.route("/:communityId/messages")
  .get(varifyJWt, getMessages);   //done





// Chat requests
router.route("/requests")
  .post(varifyJWt, sendRequest)
  .put(varifyJWt, acceptChatRequest);   //done but there is an error user can send the request again and again even if the other user accepted the request 

export default router