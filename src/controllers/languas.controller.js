import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addLanguages = asyncHandler(async (req, res) => {
    const { languages } = req.body;

    if (!Array.isArray(languages) || languages.length === 0) {
        throw new ApiError(400, "Please provide at least one language");
    }

    const formattedLanguages = languages.map((language) => {
        const { id, lang, image } = language;

        if (
            !id?.trim() ||
            !lang?.trim() ||
            !image?.trim()
        ) {
            throw new ApiError(
                400,
                "Each language must have id, lang and image"
            );
        }

        return {
            id: id.trim().toLowerCase(),
            lang: lang.trim(),
            image: image.trim()
        };
    });

    await prisma.language.createMany({
        data: formattedLanguages,
        skipDuplicates: true
    });

    const allLanguages = await prisma.language.findMany({
        orderBy: {
            lang: "asc"
        }
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            allLanguages,
            "Languages added successfully"
        )
    );
});
const getAllLanguages = asyncHandler(async (req, res) => {
    const languages = await prisma.language.findMany({
        orderBy: {
            lang: "asc"
        },
        select: {
            id: true,
            lang: true,
            image: true
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            languages,
            "Languages fetched successfully"
        )
    );
});

export { addLanguages,getAllLanguages };