import { asyncHandler } from "../utils/asyncHandler.js";
import { instance } from "../services/payment/razorpay.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { ApiError } from "../utils/ApiErro.js";


const checkout=asyncHandler(async (req,res)=>{
    const {amount}=req.body;
    const options = {
    amount: Number(amount*100),  // Amount is in currency subunits. 
    currency: "INR",
    };

    const order =await instance.orders.create(options);

    return res.status(200).json(
        new ApiResponse(200,order,"checkout done")
    )
})
const paymentVarification = asyncHandler(async(req,res)=>{
    const {razorpay_payment_id,razorpay_order_id,razorpay_signature}=req.body
    if (
        !razorpay_payment_id ||
        !razorpay_order_id ||
        !razorpay_signature
    ) {
        throw new ApiError(400, "Payment verification data is missing");
    }
    const isValid = validatePaymentVerification(
        { 
            order_id:razorpay_order_id,
            payment_id:razorpay_payment_id
        },
        razorpay_signature,
        process.env.RAZORPAY_SECRET_KEY
    )

     if (!isValid) {
        throw new ApiError(400, "Invalid payment signature");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id
            },
            "Payment verified successfully"
        )
    );
    

})

export {checkout,paymentVarification}