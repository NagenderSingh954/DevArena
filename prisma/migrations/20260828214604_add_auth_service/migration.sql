-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('google', 'github');

-- CreateTable
CREATE TABLE "Oauth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" "Provider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oauth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Oauth_userId_key" ON "Oauth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Oauth_email_key" ON "Oauth"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Oauth_providerAccountId_key" ON "Oauth"("providerAccountId");

-- CreateIndex
CREATE INDEX "Oauth_email_idx" ON "Oauth"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Oauth_provider_providerAccountId_key" ON "Oauth"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "Oauth" ADD CONSTRAINT "Oauth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
