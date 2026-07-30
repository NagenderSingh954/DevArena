import { prisma } from "../../../lib/prisma.js";
import { ApiError } from "../../utils/ApiErro.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const ownerAuth = (model, paramName) => {
    return asyncHandler(async (req, _, next) => {
        const id = req.params[paramName];

        const record = await prisma[model].findUnique({
            where: { id }
        });

        if (!record) {
            throw new ApiError(404, `${model} not found`);
        }

        if (record.ownerId !== req.user.id) {
            throw new ApiError(403, "Unauthorized");
        }

        req[model] = record;
        next();
    });
};

export { ownerAuth };