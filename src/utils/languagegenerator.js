import { prisma } from "../../lib/prisma.js";

async function main() {
  await prisma.language.createMany({
    data: [
      {
        id: "cpp",
        lang: "C++",
        image: "gcc:14",
      },
      {
        id: "java",
        lang: "Java",
        image: "eclipse-temurin:21",
      },
      {
        id: "javascript",
        lang: "JavaScript",
        image: "node:22",
      },
      {
        id: "python",
        lang: "Python",
        image: "python:3.13",
      },
    ],
  });

  console.log("Languages added successfully.");
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });