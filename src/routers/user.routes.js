import { Router } from "express";
import { changeEmail, changePassword, channgeAvatar, getAllUsers, getCurrentUser, getUserProfile, getUserSubscrition, loginUser, logout, refreshAccessToken, registerUser, updateUserDetail } from "../controllers/user.controller.js";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { getAllContest } from "../controllers/contest.controller.js";



const router = Router();
router.route('/').get(varifyJWt,getCurrentUser)
router.route('/get/all').get(getAllUsers)

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/avatar-change').patch(varifyJWt,channgeAvatar)
router.route('/passchange').patch(varifyJWt,changePassword)
router.route('/email-change').patch(varifyJWt,changeEmail)
router.route('/logout').post(varifyJWt,logout)
router.route('/refresh-token').post(varifyJWt,refreshAccessToken)
router.route('/current-user').get(varifyJWt,getCurrentUser)
router.route('/update-account').patch(varifyJWt,updateUserDetail)
router.route('/get/:username').get(getUserProfile)
router.route('/get/Subscription-status/:username').get(varifyJWt,getUserSubscrition)




export default router