-- AlterTable
ALTER TABLE `User` ADD COLUMN `customerId` VARCHAR(191) NULL,
    MODIFY `role` ENUM('ADMIN', 'DIRECTOR', 'ESTIMATOR', 'STAFF', 'CLIENT', 'PRODUCTION', 'INSTALLER', 'READ_ONLY') NOT NULL DEFAULT 'ESTIMATOR';

-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `portalEnabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `ClientProgramme` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `summary` TEXT NULL,
    `status` ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'PLANNING',
    `targetCompletionDate` DATETIME(3) NULL,
    `internalProjectManagerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClientProgramme_customerId_idx`(`customerId`),
    INDEX `ClientProgramme_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientProgrammeContact` (
    `id` VARCHAR(191) NOT NULL,
    `programmeId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ClientProgrammeContact_userId_idx`(`userId`),
    UNIQUE INDEX `ClientProgrammeContact_programmeId_userId_key`(`programmeId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientProject` (
    `id` VARCHAR(191) NOT NULL,
    `programmeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('INITIAL_ENQUIRY', 'SITE_SURVEY', 'QUOTATION', 'ARTWORK', 'CLIENT_APPROVAL', 'PRODUCTION', 'INSTALLATION_SCHEDULED', 'INSTALLED', 'COMPLETE', 'ON_HOLD') NOT NULL DEFAULT 'INITIAL_ENQUIRY',
    `siteAddress` TEXT NULL,
    `siteContactName` VARCHAR(191) NULL,
    `siteContactEmail` VARCHAR(191) NULL,
    `siteContactPhone` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `surveyDate` DATETIME(3) NULL,
    `targetDate` DATETIME(3) NULL,
    `quoteStatus` ENUM('NOT_STARTED', 'DRAFT', 'SENT', 'ACCEPTED', 'CHANGES_REQUESTED') NOT NULL DEFAULT 'NOT_STARTED',
    `artworkStatus` ENUM('NOT_STARTED', 'IN_PROGRESS', 'PROOF_SENT', 'APPROVED', 'AMENDMENTS_REQUESTED') NOT NULL DEFAULT 'NOT_STARTED',
    `productionStatus` ENUM('NOT_STARTED', 'READY', 'IN_PROGRESS', 'COMPLETE') NOT NULL DEFAULT 'NOT_STARTED',
    `installationStatus` ENUM('NOT_SCHEDULED', 'SCHEDULED', 'IN_PROGRESS', 'INSTALLED', 'COMPLETE') NOT NULL DEFAULT 'NOT_SCHEDULED',
    `notes` TEXT NULL,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClientProject_programmeId_idx`(`programmeId`),
    INDEX `ClientProject_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectStage` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `completedAt` DATETIME(3) NULL,
    `renamedFrom` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectStage_projectId_idx`(`projectId`),
    UNIQUE INDEX `ProjectStage_projectId_sortOrder_key`(`projectId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalProjectMessage` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `senderName` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `visibility` ENUM('CLIENT_VISIBLE', 'INTERNAL_ONLY') NOT NULL DEFAULT 'CLIENT_VISIBLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PortalProjectMessage_projectId_visibility_idx`(`projectId`, `visibility`),
    INDEX `PortalProjectMessage_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalDocument` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `type` ENUM('SITE_SURVEY', 'PHOTOGRAPHS', 'QUOTATION', 'ARTWORK_PROOF', 'APPROVAL', 'PURCHASE_ORDER', 'INVOICE', 'INSTALLATION_DOCUMENTATION', 'COMPLETION_PHOTOGRAPHS', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `visibility` ENUM('CLIENT_VISIBLE', 'INTERNAL_ONLY') NOT NULL DEFAULT 'CLIENT_VISIBLE',
    `version` INTEGER NOT NULL DEFAULT 1,
    `description` TEXT NULL,
    `uploadedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PortalDocument_projectId_type_idx`(`projectId`, `type`),
    INDEX `PortalDocument_visibility_idx`(`visibility`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtworkApproval` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NULL,
    `proofVersion` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('PENDING', 'APPROVED', 'AMENDMENTS_REQUESTED', 'SUPERSEDED') NOT NULL DEFAULT 'PENDING',
    `approverName` VARCHAR(191) NOT NULL,
    `approverUserId` VARCHAR(191) NULL,
    `comments` TEXT NULL,
    `checksConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ArtworkApproval_projectId_status_idx`(`projectId`, `status`),
    INDEX `ArtworkApproval_documentId_idx`(`documentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientActionRequest` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE') NOT NULL DEFAULT 'OPEN',
    `assignedUserId` VARCHAR(191) NULL,
    `completionDate` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClientActionRequest_projectId_status_idx`(`projectId`, `status`),
    INDEX `ClientActionRequest_assignedUserId_idx`(`assignedUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `invitedById` VARCHAR(191) NULL,
    `acceptedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ClientInvitation_tokenHash_key`(`tokenHash`),
    INDEX `ClientInvitation_customerId_email_idx`(`customerId`, `email`),
    INDEX `ClientInvitation_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetToken_tokenHash_key`(`tokenHash`),
    INDEX `PasswordResetToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserTwoFactor` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `secretEncrypted` TEXT NULL,
    `recoveryCodes` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserTwoFactor_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `event` ENUM('CLIENT_INVITATION', 'CLIENT_VISIBLE_MESSAGE', 'NEW_ARTWORK_PROOF', 'APPROVAL_REQUESTED', 'AMENDMENT_REQUESTED', 'DOCUMENT_UPLOADED', 'INSTALLATION_DATE_CONFIRMED', 'CLIENT_ACTION_REQUEST_ASSIGNED') NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmailTemplate_event_key`(`event`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalNotification` (
    `id` VARCHAR(191) NOT NULL,
    `event` ENUM('CLIENT_INVITATION', 'CLIENT_VISIBLE_MESSAGE', 'NEW_ARTWORK_PROOF', 'APPROVAL_REQUESTED', 'AMENDMENT_REQUESTED', 'DOCUMENT_UPLOADED', 'INSTALLATION_DATE_CONFIRMED', 'CLIENT_ACTION_REQUEST_ASSIGNED') NOT NULL,
    `status` ENUM('QUEUED', 'SENT', 'FAILED', 'SUPPRESSED') NOT NULL DEFAULT 'QUEUED',
    `userId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `payload` JSON NULL,
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentAt` DATETIME(3) NULL,

    INDEX `PortalNotification_event_status_idx`(`event`, `status`),
    INDEX `PortalNotification_customerId_idx`(`customerId`),
    INDEX `PortalNotification_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientProgramme` ADD CONSTRAINT `ClientProgramme_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientProgramme` ADD CONSTRAINT `ClientProgramme_internalProjectManagerId_fkey` FOREIGN KEY (`internalProjectManagerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientProgrammeContact` ADD CONSTRAINT `ClientProgrammeContact_programmeId_fkey` FOREIGN KEY (`programmeId`) REFERENCES `ClientProgramme`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientProgrammeContact` ADD CONSTRAINT `ClientProgrammeContact_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientProject` ADD CONSTRAINT `ClientProject_programmeId_fkey` FOREIGN KEY (`programmeId`) REFERENCES `ClientProgramme`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectStage` ADD CONSTRAINT `ProjectStage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ClientProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalProjectMessage` ADD CONSTRAINT `PortalProjectMessage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ClientProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalProjectMessage` ADD CONSTRAINT `PortalProjectMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalDocument` ADD CONSTRAINT `PortalDocument_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ClientProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalDocument` ADD CONSTRAINT `PortalDocument_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtworkApproval` ADD CONSTRAINT `ArtworkApproval_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ClientProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtworkApproval` ADD CONSTRAINT `ArtworkApproval_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `PortalDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtworkApproval` ADD CONSTRAINT `ArtworkApproval_approverUserId_fkey` FOREIGN KEY (`approverUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientActionRequest` ADD CONSTRAINT `ClientActionRequest_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ClientProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientActionRequest` ADD CONSTRAINT `ClientActionRequest_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientActionRequest` ADD CONSTRAINT `ClientActionRequest_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientInvitation` ADD CONSTRAINT `ClientInvitation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientInvitation` ADD CONSTRAINT `ClientInvitation_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordResetToken` ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTwoFactor` ADD CONSTRAINT `UserTwoFactor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalNotification` ADD CONSTRAINT `PortalNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalNotification` ADD CONSTRAINT `PortalNotification_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalNotification` ADD CONSTRAINT `PortalNotification_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ClientProject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

