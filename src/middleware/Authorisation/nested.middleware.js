import { prisma } from "../../../lib/prisma";
import { asyncHandler } from "../../utils/asyncHandler";

const isReplyOwner = asyncHandler(async (req, res, next) => {
    const { replyId } = req.params;

    const reply = await prisma.nestedComment.findUnique({
        where: {
            id: replyId,
        },
        select: {
            ownerId: true,
        },
    });

    if (!reply) {
        throw new ApiError(404, "Reply not found");
    }

    if (reply.ownerId !== req.user.id) {
        throw new ApiError(403, "Unauthorized");
    }

    next();
});

export default isReplyOwner