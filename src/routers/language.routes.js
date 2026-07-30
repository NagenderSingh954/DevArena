import { Router } from "express";
import { addLanguages, getAllLanguages} from "../controllers/languas.controller.js";


const router = Router();

router.route('/').post(addLanguages).get(getAllLanguages)

export default router;