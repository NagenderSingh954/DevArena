import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { getFollowers, getFollowing, getFollowStatus, toggleFollow } from "../controllers/followers.controller.js";

const router=Router({mergeParams:true})

router.route('/').post(varifyJWt,toggleFollow)

router.route('/get/followers').get(getFollowers)

router.route('/get/followings').get(getFollowing)

router.route('/get/status').get(varifyJWt,getFollowStatus)


export default router