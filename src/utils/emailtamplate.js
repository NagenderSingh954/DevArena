
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

export default otpEmailTemplate;
              
