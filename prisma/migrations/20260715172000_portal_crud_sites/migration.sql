-- AlterTable
ALTER TABLE `ClientProgramme` ADD COLUMN `archivedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ClientProject` ADD COLUMN `archivedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `PortalProjectMessage` ADD COLUMN `siteId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PortalDocument` ADD COLUMN `siteId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ArtworkApproval` ADD COLUMN `siteId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ClientActionRequest` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `siteId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PortalNotification` ADD COLUMN `archivedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `ClientSite` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('INITIAL_ENQUIRY', 'SITE_SURVEY', 'QUOTATION', 'ARTWORK', 'CLIENT_APPROVAL', 'PRODUCTION', 'INSTALLATION_SCHEDULED', 'INSTALLED', 'COMPLETE', 'ON_HOLD') NOT NULL DEFAULT 'INITIAL_ENQUIRY',
    `address` TEXT NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `internalNotes` TEXT NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClientSite_projectId_idx`(`projectId`),
    INDEX `ClientSite_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientSiteTimeline` (
    `id` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `sortOrder` INTEGER NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClientSiteTimeline_siteId_idx`(`siteId`),
    UNIQUE INDEX `ClientSiteTimeline_siteId_sortOrder_key`(`siteId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PortalProjectMessage_siteId_visibility_idx` ON `PortalProjectMessage`(`siteId`, `visibility`);

-- CreateIndex
CREATE INDEX `PortalDocument_siteId_type_idx` ON `PortalDocument`(`siteId`, `type`);

-- CreateIndex
CREATE INDEX `ArtworkApproval_siteId_status_idx` ON `ArtworkApproval`(`siteId`, `status`);

-- CreateIndex
CREATE INDEX `ClientActionRequest_siteId_status_idx` ON `ClientActionRequest`(`siteId`, `status`);

-- AddForeignKey
ALTER TABLE `ClientSite` ADD CONSTRAINT `ClientSite_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ClientProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientSiteTimeline` ADD CONSTRAINT `ClientSiteTimeline_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `ClientSite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalProjectMessage` ADD CONSTRAINT `PortalProjectMessage_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `ClientSite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalDocument` ADD CONSTRAINT `PortalDocument_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `ClientSite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtworkApproval` ADD CONSTRAINT `ArtworkApproval_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `ClientSite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientActionRequest` ADD CONSTRAINT `ClientActionRequest_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `ClientSite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

