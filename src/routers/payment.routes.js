import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware.js";
import { checkout, paymentVarification } from "../controllers/payment.controller.js";

const router =Router();

router.route('/checkout').post(varifyJWt,checkout)
router.route('/paymentVarification').post(varifyJWt,paymentVarification)

export default router