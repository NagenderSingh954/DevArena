import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from 'bcrypt'
import { ApiError } from "../utils/ApiErro.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessToken, generateRefreshToken } from "../services/auth/jwt.js";
import { use } from "react";
import jwt from 'jsonwebtoken'
import { decodeIdToken, generateCodeVerifier, generateState, Google } from "arctic";
import google from "../../lib/oauth.js";



const userActive = asyncHandler(async (userId) => {
    const userInfro = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            status: true
        }
    })

    if (userInfro.status != 'active') {
        return false
    }
    return true
})

const requiredobj = {
    id: true,
    username: true,
    avatar: true,
    fullName: true
}

const encryptpss = async (pass) => {
    const encryptedPass = await bcrypt.hash(pass, 10);
    return encryptedPass;

}

const generateAccessAndrefreshToken = async (userId) => {
    try {
        const accessToken = await generateAccessToken(userId)
        const refreshToken = await generateRefreshToken(userId)
        // console.log(accesstoken,'\n',refreshToken)
        const updateUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                refreshToken: refreshToken,
                refreshTokenExpiry: new Date(new Date().setDate(new Date().getDate() + 10))
            }
        })

        return { accessToken, refreshToken }
    } catch (error) {
       
    }
}

const registerUser = asyncHandler(async (req, res) => {
    /**
     get the user info 
     check if ealredy exite or not 
     hash the password 

     */
    const { username, email, password, type, fullName, avatar, bio, git, phone } = req.body;
    if ([username, email, password, type].some((field) => field.trim() === '')) {
        throw new ApiError(400, "All Fields are Required")
    }
    const existing = await prisma.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    })



    if (existing) {
        throw new ApiError(409, "User With Same name or Email Alredy Exit")
    }
    const hashedpass = await encryptpss(password)

    const user = await prisma.user.create({
        data: {
            username,
            email,
            fullName,
            password: hashedpass,
            avatar,
            type,
            bio,
            git,
            phone
        },
        omit: {
            password: true
        }
    })

    if (!user) {
        throw new ApiError(500, "Internal server error while creating the User")
    }

    return res.status(201).json(
        new ApiResponse(201, user, "User Created Successfully")
    )

})


const loginHelper = async (user, res, redirect = true) => {

    const { accessToken, refreshToken } =
        await generateAccessAndrefreshToken(user.id);

    const options = {
        httpOnly: true,
        secure: false, // localhost
        sameSite: "lax",
    };

    res
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options);

    if (redirect) {
        return res.redirect(process.env.CLIENT_URL);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { user },
            "User has been logged in successfully"
        )
    );
};


const loginUser = asyncHandler(async (req, res) => {
    /*
    take info 
    validate 
    generate tokens 
    send cookies and responce 
    */

    const { email, password } = req.body
    if ([email, password].some((f) => f.trim() == '')) {
        throw new ApiError(400, "All Field Are required")
    }
    const user = await prisma.user.findUnique({
        where: {
            email,
        }
        // select: {
        //     id: true,
        //     username: true,
        //     email: true,
        //     fullName: true,
        //     avatar: true,
        //     role: true,
        //     type: true,
        //     bio: true,
        //     git: true,
        //     phone: true,
        //     refreshToken:true,
        //     refreshTokenExpiry:true,
        //     emailVerified: true,
        //     status: true,
        //     createdAt: true,
        //     updatedAt: true,
        // },
    })
    if (!user) {
        throw new ApiError(404, "User Account with that Email not found")
    }
    const passcheck = await bcrypt.compare(password, user.password)
    if (!passcheck) {
        throw new ApiError(404, "Credential are invalid")
    }
    const { accessToken, refreshToken } = await generateAccessAndrefreshToken(user.id)

    const options = {      //be default cookies can be modiefied by the anyone but through this option we can tell who can modify
        httpOnly: true,      //Only server can modify these cookies through these options 
        secure: true,
        sameSite: "none",
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { user, accessToken, refreshToken }, "User has been logged in successfully")
        )

})

const channgeAvatar = asyncHandler(async (req, res) => {
    const { avatar } = req.body
    if (!avatar) {
        throw new ApiError(404, "New Avatar Not found")
    }
    // const userDetail = await prisma.user.findUnique({
    //     where: {
    //         id: req.user?.id
    //     },
    //     omit:{
    //         password:true,
    //         refreshToken:true,
    //         refreshTokenExpiry:true
    //     }
    // })
    // if (!userDetail) {
    //     throw new ApiError(404, "User Not Found")
    // }
    const updatedUser = await prisma.user.update({
        where: {
            id: req.user?.id
        },
        data: {
            avatar: avatar
        },
        select: requiredobj
    })
    if (!updatedUser) {
        throw new ApiError(401, "Error While Updating the User detail")
    }
    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Avatar Updated successfully ")
    )
})      //here Authorization needed to be checked 

const changePassword = asyncHandler(async (req, res) => {
    /*
    take the new pass
    varify user 
    change pass
     */
    const { oldPassword, newPassword } = req.body
    if ([oldPassword, newPassword].some((field) => field.trim() === '')) {
        throw new ApiError(400, "All Fields are Required")
    }
    if (oldPassword == newPassword) {
        throw new ApiError(400, "new password must be different ")
    }
    const user = await prisma.user.findUnique({
        where: {
            id: req.user?.id
        },
        select: {
            ...requiredobj,
            password: true,
        },
    })
    if (!user) {
        throw new ApiError(401, "UnAuthorised Access")
    }


    const checkoldpass = await bcrypt.compare(oldPassword, user.password)
    if (!checkoldpass) {
        throw new ApiError(401, "Password Mismatch")
    }
    const hashNewpass = await encryptpss(newPassword);


    const updateduser = await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            password: hashNewpass
        },
        select: requiredobj
    })
    if (!updateduser) {
        throw new ApiError(500, "Error occure while updating the password")
    };

    return res.status(201).json(
        new ApiResponse(201, updateduser, "Password Updated Successfully")
    )
})   //here Authorization needed to be checked 

const changeEmail = asyncHandler(async (req, res) => {
    const { newemail } = req.body;

    if (!newemail || newemail.trim() === "") {
        throw new ApiError(400, "Email is required");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: req.user?.id,
        },
    });

    if (newemail == user.email) {
        throw new ApiError(400, "new Email should be different")
    }

    if (!user) {
        throw new ApiError(401, "Unauthorized Access");
    }

    // Check if the email is already taken
    const existingUser = await prisma.user.findUnique({
        where: {
            email: newemail,
        },
    });

    if (existingUser && existingUser.id !== user.id) {
        throw new ApiError(409, "Email already exists");
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            email: newemail,
        },
        select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            avatar: true,
            role: true,
            emailVerified: true,
            updatedAt: true,
        },
    });

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Email updated successfully")
    );
});
const logout = asyncHandler(async (req, res) => {
    await prisma.user.update({
        where: {
            id: req.user?.id
        },
        data: {
            refreshToken: null,
            refreshTokenExpiry: null
        }
    })
    const options = {
        httpOnly: true,
        secure: false
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, 'User Logged Out Successfully')
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }
    try {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        })

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expire or Invalid ")
        }

        const { accessToken, newRefreshToken } = await generateAccessAndrefreshToken(user.id)
        const options = {      //be default cookies can be modiefied by the anyone but through this option we can tell who can modify
            httpOnly: true,      //Only server can modify these cookies through these options 
            secure: true
        }

        return res.status(200)
            .cookie("accessToke", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "Access Token Refreshed Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }


})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = req.user
    return res.status(200).json(
        new ApiResponse(200, user, "current User Fetch Successfully")  // they give direct json instead APIresponce
    )
})

const updateUserDetail = asyncHandler(async (req, res) => {
    const { username, fullName, type, bio, git, phone } = req.body;

    const user = await prisma.user.findUnique({
        where: {
            id: req.user?.id,
        },
    });

    if (!user) {
        throw new ApiError(401, "Unauthorized Access");
    }

    // Check username uniqueness
    if (username) {
        const existingUser = await prisma.user.findUnique({
            where: {
                username,
            },
        });

        if (existingUser && existingUser.id !== user.id) {
            throw new ApiError(409, "Username already exists");
        }
    }

    // Build update object dynamically
    const updateData = {};

    if (username !== undefined) updateData.username = username.trim();
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (type !== undefined) updateData.type = type.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (git !== undefined) updateData.git = git.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No data provided to update");
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: user.id,
        },
        data: updateData,
        select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            avatar: true,
            role: true,
            type: true,
            bio: true,
            git: true,
            phone: true,
            emailVerified: true,
            status: true,
            updatedAt: true,
        },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "User details updated successfully"
        )
    );
});

const getUserProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username.trim()) {
        throw new ApiError(400, "Username is missing or not existed")
    }
    const userSelect = {
        id: true,
        username: true,
        avatar: true,
        role: true
    };
    const user = await prisma.user.findUnique({
        where: {
            username
        },
        omit: {
            password: true,
            refreshToken: true,
            refreshTokenExpiry: true
        },
        include: {
            contestOwner: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    contentType: true,
                    visibility: true,
                    createdAt: true,
                    endingAt: true,
                    owner: {
                        select: userSelect
                    },
                    _count: {
                        select: {
                            participants: true,
                            problems: true,
                            comment: true
                        }
                    }
                },
            },
            joinedContests: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    contentType: true,
                    createdAt: true,
                    endingAt: true,
                    owner: {
                        select: userSelect
                    },
                    _count: {
                        select: {
                            participants: true,
                            problems: true,
                            comment: true
                        }
                    }
                },

            },
            _count: {
                select: {
                    followers: true,
                    following: true,
                    communitiesAdmin: true,
                    communityMemberships: true,
                    contestOwner: true,
                    joinedContests: true,
                    submittedCodes: true
                }
            },
        },

    })

    if (!user) {
        throw new ApiError(404, "User Not Found")
    }
    if (userActive(user.id)) {
        throw new ApiError(404, "User no Longer Existe")
    }

    return res.status(200).json(
        new ApiResponse(200, user, "User data Fetched Successfully")
    )
})

const getUserSubscrition = asyncHandler(async (req, res) => {
    const { username } = req.user
    if (!username) {
        throw new ApiError(400, "Please Provide the Username")
    }

    const userInfo = await prisma.user.findUnique({
        where: {
            username
        },
        select: {
            id: true,
            isSubscribed: true,
            package: true
        }
    })
    if (!userInfo) {
        throw new ApiError(404, "User Not Found")
    }
    if (userActive(userInfo.id)) {
        throw new ApiError(404, "User no Longer Existe")
    }  // here we can directly check the status instead of making another call
    return res.status(200).json(
        new ApiResponse(200, userInfo, "User Subscription Status Fetched Succcessfully")
    )
})


const getAllUsers = asyncHandler(async (req, res) => {
    
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 15;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: limit,
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                role: true,
                createdAt: true,
            },
        }),
        prisma.user.count(),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                users,
                pagination: {
                    totalUsers,
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    hasNextPage: page < Math.ceil(totalUsers / limit),
                    hasPreviousPage: page > 1,
                },
            },
            "Users fetched successfully."
        )
    );
});

const searchUser = asyncHandler(async (req, res) => {
    const { username } = req.query;
    if (!username || username.trim() == '') {
        throw new ApiError(404, "User Not found")
    }

    const user = await prisma.user.findMany({
        where: {
            username: {
                contains: username,
                mode: "insensitive"
            }
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            username: true,
            avatar: true,
            fullName: true
        }
    })

    return res.status(200).json(
        new ApiResponse(200, user, "User fetched Successfully")
    )
})
const getChatNotification = asyncHandler(async (req, res) => {
    const request = await prisma.chatRequest.findMany({
        where: {
            receiverId: req.user.id
        },
        select: {
            id: true,
            status: true,
            sender: {
                select: {
                    username: true,
                    avatar: true,
                    fullName: true
                }
            }
        },
        orderBy: {
            createdAt: "desc",
        }
    })
    return res.status(200).json(
        new ApiResponse(200, request, "Request fetched Successfully")
    )

})

const getGoogleLoginPage = asyncHandler(async (req, res) => {
    const state = generateState();
    const codeVarifier = generateCodeVerifier();

    const url = google.createAuthorizationURL(state, codeVarifier, ["openid", "profile", "email"]);
   

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "lax",  //cookies are maintain while redirecting
        maxAge: 10 * 60 * 1000
    }

    res.cookie("google_oauth_state", state, options)
    res.cookie("google_code_verifier", codeVarifier, options)

    res.redirect(url.toString())
})

const getGoogleLoginCallBack = asyncHandler(async (req, res) => {
    const { state, code } = req.query;
    const { google_oauth_state: storedState, google_code_verifier: storedCode } = req.cookies

    if (!state || !code || !storedCode || !storedState || state !== storedState) {
        // throw new ApiError(400,"Could not varify teh user")

        return res.redirect(`${process.env.CLIENT_URL}/login`)
    }

    let token = await google.validateAuthorizationCode(code, storedCode);
    // console.log(token);
    if (!token) {
        return res.redirect(`${process.env.CLIENT_URL}/login`);
    }

    const claim = decodeIdToken(token.idToken());
    const { sub: googleId, name, email } = claim;

    //now the main part of teh login 
    //con 1: User alredy existe with the google auth linked
    //con 2:User existe but the google auth is not linked 
    //con 3: User Not Exist (New User)



    //User Alredy Exist with The Google 
    const existingOAuth = await prisma.oauth.findUnique({
        where: {
            email
        },
        include: {
            user: true
        }
    })
    if (existingOAuth) {
  
        const user = existingOAuth.user;
       return loginHelper(user, res)

        // return res.redirect(`${process.env.CLIENT_URL}`);
    }


    //User Exist but the google auth is not linked and user click on the google login 

    const existingUser = await prisma.user.findUnique({
        where: {
            email
        }
    })
    if (existingUser) {
        
        const createdOauth = await prisma.oauth.create({
            data: {
                userId: existingUser.id,
                email,
                provider: "google",
                providerAccountId: googleId,
            }


        })
        
       return loginHelper(existingUser,res);


    }


    //User Not Exist 
    
    let username = email.split("@")[0];

    const usernameExists = await prisma.user.findUnique({
        where: {
            username
        }
    });

    if (usernameExists) {
        username = `${username}_${Date.now()}`;
    }

    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            fullName: name,
            avatar: "2",
            password: "",

            emailVerified: true,

            oauth: {
                create: {
                    email,
                    provider: "google",
                    providerAccountId: googleId
                }
            }
        }
    });



    return loginHelper(newUser,res);

})



export { registerUser, loginUser, channgeAvatar, changePassword, changeEmail, logout, refreshAccessToken, getCurrentUser, updateUserDetail, getUserProfile, getUserSubscrition, getAllUsers, searchUser, getChatNotification, getGoogleLoginPage ,getGoogleLoginCallBack}