import { asyncHandler } from "../utils/asyncHandler.js";
import { instance } from "../services/payment/razorpay.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { ApiError } from "../utils/ApiErro.js";
import { prisma } from "../../lib/prisma.js";


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
const paymentVarification = asyncHandler(async (req, res) => {

    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
    } = req.body;

    if (
        !razorpay_payment_id ||
        !razorpay_order_id ||
        !razorpay_signature
    ) {
        throw new ApiError(
            400,
            "Payment verification data is missing"
        );
    }

    // Verify Razorpay signature
    const isValid = validatePaymentVerification(
        {
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id
        },
        razorpay_signature,
        process.env.RAZORPAY_SECRET_KEY
    );

    if (!isValid) {
        throw new ApiError(
            400,
            "Invalid payment signature"
        );
    }

    // Get logged-in user
    const userId = req.user.id;

    // Check whether this order was already processed
    const existingSubscription = await prisma.subscription.findUnique({
        where: {
            razorpayOrderId: razorpay_order_id
        }
    });

    if (existingSubscription) {
        throw new ApiError(
            400,
            "This payment has already been processed"
        );
    }

    // Get Razorpay order to verify the actual amount
    const order = await instance.orders.fetch(
        razorpay_order_id
    );

    // Example: determine package
    // You should eventually get this from your own pending order record.
    let packageType;

    if (order.amount === 2000) {
        packageType = "premium";
    } else if (order.amount === 3000) {
        packageType = "elite";
    } else {
        throw new ApiError(
            400,
            "Invalid subscription amount"
        );
    }

    const startDate = new Date();

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create subscription + update user together
    const subscription = await prisma.$transaction(async (tx) => {

        const subscription = await tx.subscription.create({
            data: {
                userId,
                package: packageType,
                status: "active",
                startDate,
                endDate,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                amount: order.amount,
                currency: order.currency
            }
        });

        await tx.user.update({
            where: {
                id: userId
            },
            data: {
                package: packageType
            }
        });

        return subscription;
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                package: packageType,
                subscriptionId: subscription.id,
                startDate,
                endDate
            },
            "Payment verified and subscription activated successfully"
        )
    );
});

export {checkout,paymentVarification}