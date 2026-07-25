import { prisma } from "../../lib/prisma.js";

const connectDB =async()=>{
    try {
       await prisma.$connect();
       console.log("✅ PostgreSQL Connected");
    } catch (error) {
        console.error("❌ PostgreSQL Connection Failed:", error);
    throw error;
    }
}

export {connectDB}