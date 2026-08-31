import "dotenv/config";
import { Worker } from "bullmq";
import { connection } from "./queue.js";
import resend from "../services/resender.js";

console.log("🚀 Email worker file started");

const emailWorker = new Worker(
    "emails",
    async (job) => {

        console.log("Processing job:", job.id);

        console.log("To:", job.data.to);
        console.log("Subject:", job.data.subject);

    
        await resend.emails.send({
            from: job.data.from,
            to: job.data.to,
            subject: job.data.subject,
            html: job.data.html
        });

        return {
            success: true
        };
    },
    { connection }
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