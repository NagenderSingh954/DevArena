import axios from "axios";
import { ApiError } from "../../utils/ApiErro.js";

const JUDGE0_URL = process.env.JUDGE0_URL;

const submitCode = async ({
  languageId,
  sourceCode,
  stdin = "",
}) => {
  try {
    const response = await axios.post(
      `${JUDGE0_URL}/submissions`,
      {
        language_id: languageId,
        source_code: sourceCode,
        stdin,
      },
      {
        params: {
          base64_encoded: false,
          wait: true,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Judge0 Error:",
      error.response?.data || error.message
    );

    throw new Error("Judge0 execution failed");
  }
};

const submitBatch = async (submissions) => {
  try {
  
    const response = await axios.post(
      `${JUDGE0_URL}/submissions/batch`,
      {
        submissions,
      },
      {
        params: {
          base64_encoded: false,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  
    return response.data;
  } catch (error) {
    console.error(
      "Judge0 Batch Error:",
      error.response?.data || error.message
    );

    throw new Error("Judge0 batch submission failed");
  }
};
const getBatchResults = async (tokens) => {
    try {
        const maxAttempts = 30;
        const delay = 1000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {

            const response = await axios.get(
                `${JUDGE0_URL}/submissions/batch`,
                {
                    params: {
                        tokens: tokens.join(","),
                        base64_encoded: false,
                    },
                }
            );

            const submissions = response.data?.submissions;

            if (!submissions) {
                throw new Error("Invalid response from Judge0");
            }

            // Judge0 status:
            // 1 = In Queue
            // 2 = Processing
            // 3+ = Finished
            const completed = submissions.every(
                (submission) => submission.status?.id >= 3
            );

            if (completed) {
                return response.data;
            }

            // Wait before checking again
            await new Promise((resolve) =>
                setTimeout(resolve, delay)
            );
        }

        throw new ApiError(400,"Judge0 execution timed out");

    } catch (error) {
        console.error(
            "Judge0 Results Error:",
            error.response?.data || error.message
        );

        if (error.message === "Judge0 execution timed out") {
            throw error;
        }

        throw new ApiError(404,"Failed to get Judge0 batch results");
    }
};

export {submitBatch,submitCode,getBatchResults}