
const otpEmailTemplate = (otp) => {
    return` 

        <html lang="en">
            <head>
                <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">

                        <title>Verify Your Email - CodeArena</title>
                    </head>

                    <body style="
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
    font-family: Arial, Helvetica, sans-serif;
">

                        <div style="
        width: 100%;
        padding: 40px 0;
    ">

                            <div style="
            max-width: 500px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-sizing: border-box;
            border: 1px solid #e5e5e5;
        ">

                                <!-- Logo / Brand -->
                                <div style="
                text-align: center;
                margin-bottom: 30px;
            ">
                                    <h1 style="
                    margin: 0;
                    font-size: 28px;
                    color: #111111;
                ">
                                        CodeArena
                                    </h1>
                                </div>

                                <!-- Heading -->
                                <h2 style="
                margin: 0 0 15px 0;
                color: #222222;
                font-size: 24px;
                text-align: center;
            ">
                                    Verify Your Email
                                </h2>

                                <!-- Message -->
                                <p style="
                color: #555555;
                font-size: 15px;
                line-height: 1.6;
                text-align: center;
                margin: 0 0 25px 0;
            ">
                                    Thanks for joining CodeArena!
                                    Please use the verification code below
                                    to verify your email address.
                                </p>

                                <!-- OTP -->
                                <div style="
                background-color: #f3f4f6;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                margin: 25px 0;
            ">
                                    <span style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #111111;
                ">
                                        ${otp}
                                    </span>
                                </div>

                                <!-- Expiry -->
                                <p style="
                color: #555555;
                font-size: 14px;
                text-align: center;
                line-height: 1.5;
            ">
                                    This verification code will expire in
                                    <strong>3 minutes</strong>.
                                </p>

                                <!-- Security Notice -->
                                <p style="
                color: #777777;
                font-size: 13px;
                line-height: 1.5;
                text-align: center;
                margin-top: 25px;
            ">
                                    If you didn't request this code, you can safely
                                    ignore this email. Do not share this code with anyone.
                                </p>

                                <!-- Divider -->
                                <hr style="
                border: none;
                border-top: 1px solid #eeeeee;
                margin: 30px 0;
            ">

                                    <!-- Footer -->
                                    <p style="
                margin: 0;
                text-align: center;
                color: #999999;
                font-size: 12px;
            ">
                                        © 2026 CodeArena. All rights reserved.
                                    </p>

                            </div>

                        </div>

                    </body>
                </html>
                `;
};


const welcomeEmailTemplate = (name) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CodeArena</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f4f6f8;
    font-family: Arial, Helvetica, sans-serif;
    color: #1f2937;
">

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 15px;">

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                        max-width: 600px;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                    "
                >

                    <!-- Header -->
                    <tr>
                        <td style="
                            background-color: #111827;
                            padding: 28px 30px;
                            text-align: center;
                        ">
                            <h1 style="
                                margin: 0;
                                color: #ffffff;
                                font-size: 28px;
                                letter-spacing: 0.5px;
                            ">
                                CodeArena
                            </h1>

                            <p style="
                                margin: 8px 0 0;
                                color: #d1d5db;
                                font-size: 14px;
                            ">
                                Code. Compete. Improve.
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 35px;">

                            <h2 style="
                                margin: 0 0 20px;
                                font-size: 24px;
                                color: #111827;
                            ">
                                Welcome${name ? `, ${name}` : ""}! 👋
                            </h2>

                            <p style="
                                margin: 0 0 18px;
                                font-size: 16px;
                                line-height: 1.7;
                                color: #4b5563;
                            ">
                                We're excited to have you join
                                <strong>CodeArena</strong>.
                            </p>

                            <p style="
                                margin: 0 0 25px;
                                font-size: 16px;
                                line-height: 1.7;
                                color: #4b5563;
                            ">
                                CodeArena is a place where you can sharpen
                                your coding skills, solve challenging problems,
                                compete with other developers, and track your
                                progress.
                            </p>

                            <!-- Features -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">

                                <tr>
                                    <td style="padding: 12px 0;">
                                        <strong style="color: #111827;">
                                            💻 Practice
                                        </strong>
                                        <br>
                                        <span style="color: #6b7280; font-size: 14px;">
                                            Solve coding problems and improve your skills.
                                        </span>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 12px 0;">
                                        <strong style="color: #111827;">
                                            🏆 Compete
                                        </strong>
                                        <br>
                                        <span style="color: #6b7280; font-size: 14px;">
                                            Challenge yourself and compete with others.
                                        </span>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 12px 0;">
                                        <strong style="color: #111827;">
                                            📈 Grow
                                        </strong>
                                        <br>
                                        <span style="color: #6b7280; font-size: 14px;">
                                            Track your progress and become a better developer.
                                        </span>
                                    </td>
                                </tr>

                            </table>

                            <!-- CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0 15px;">

                                        <a
                                            href="${process.env.FRONTEND_URL}"
                                            style="
                                                display: inline-block;
                                                padding: 14px 28px;
                                                background-color: #111827;
                                                color: #ffffff;
                                                text-decoration: none;
                                                border-radius: 8px;
                                                font-size: 15px;
                                                font-weight: bold;
                                            "
                                        >
                                            Start Coding
                                        </a>

                                    </td>
                                </tr>
                            </table>

                            <p style="
                                margin: 25px 0 0;
                                font-size: 14px;
                                line-height: 1.6;
                                color: #9ca3af;
                                text-align: center;
                            ">
                                We're glad you're here. Good luck and happy coding! 🚀
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="
                            padding: 22px 30px;
                            background-color: #f9fafb;
                            text-align: center;
                        ">
                            <p style="
                                margin: 0 0 8px;
                                font-size: 13px;
                                color: #6b7280;
                            ">
                                © ${new Date().getFullYear()} CodeArena
                            </p>

                            <p style="
                                margin: 0;
                                font-size: 12px;
                                color: #9ca3af;
                            ">
                                You received this email because you created an
                                account on CodeArena.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
    `;
};

export { welcomeEmailTemplate};



export default otpEmailTemplate;
              
