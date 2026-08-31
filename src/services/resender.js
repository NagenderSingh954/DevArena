import { Resend } from "resend";

const resend = new Resend(process.env.RESENDER_API_KEY);

export default resend