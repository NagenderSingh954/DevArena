import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "./queue.js";
import resend from "../services/resender.js";
import transporter from "../../lib/mail.js";

console.log("🚀 Email worker file started");

const emailWorker = new Worker(
    "emails",
    async (job) => {
        console.log("Processing job:", job.id);

        const {
            from,
            to,
            subject,
            html
        } = job.data;

        console.log("To:", to);
        console.log("Subject:", subject);

        const info = await transporter.sendMail({
            from: from || process.env.EMAIL_USER,
            to,
            subject,
            html,
        });

        console.log("Email sent:", info.messageId);

        return {
            success: true,
            messageId: info.messageId,
        };
    },
    {
        connection,
    }
);

emailWorker.on("completed", (job, result) => {
    console.log(
        "Job Completed...",
        job.id,
        job.name,
        result
    );
});

emailWorker.on("failed", (job, err) => {
    console.log(
        "Job Failed...",
        job?.id,
        job?.name,
        err.message
    );
});

console.log("Email worker started...");