import { Router } from "express";
import { varifyJWt } from "../middleware/auth.middleware";

const router=Router()

router.route('/create').post(varifyJWt,)



export default router