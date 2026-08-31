import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { generator, getOTP, varifyOTP } from "../controllers/auth.controller.js";

const router=Router()

router.route('/otp/generate').post(varifyJWt,generator)
router.route('/otp/varify').post(varifyOTP)

router.route('/otp/get/:email').get(getOTP)

export default router