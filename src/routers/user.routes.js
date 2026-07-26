import { Router } from "express";
import { changeEmail, changePassword, channgeAvatar, getCurrentUser, loginUser, logout, refreshAccessToken, registerUser, updateUserDetail } from "../controllers/user.controller.js";
import { varifyJWt } from "../middleware/auth.middleware.js";



const router = Router();

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/avatar-change').patch(varifyJWt,channgeAvatar)
router.route('/passchange').patch(varifyJWt,changePassword)
router.route('/email-change').patch(varifyJWt,changeEmail)
router.route('/logout').post(logout)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/current-user').get(varifyJWt,getCurrentUser)
router.route('/update-account').patch(varifyJWt,updateUserDetail)


export default router