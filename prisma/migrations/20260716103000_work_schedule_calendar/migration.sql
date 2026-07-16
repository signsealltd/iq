-- CreateTable
CREATE TABLE `WorkScheduleEvent` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED',
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NULL,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `customerId` VARCHAR(191) NULL,
    `jobId` VARCHAR(191) NULL,
    `customerName` VARCHAR(191) NULL,
    `jobReference` VARCHAR(191) NULL,
    `location` TEXT NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `assignedToId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `googleCalendarEventId` VARCHAR(191) NULL,
    `googleCalendarId` VARCHAR(191) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WorkScheduleEvent_startAt_idx`(`startAt`),
    INDEX `WorkScheduleEvent_customerId_idx`(`customerId`),
    INDEX `WorkScheduleEvent_jobId_idx`(`jobId`),
    INDEX `WorkScheduleEvent_assignedToId_idx`(`assignedToId`),
    INDEX `WorkScheduleEvent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkScheduleEvent` ADD CONSTRAINT `WorkScheduleEvent_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkScheduleEvent` ADD CONSTRAINT `WorkScheduleEvent_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkScheduleEvent` ADD CONSTRAINT `WorkScheduleEvent_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkScheduleEvent` ADD CONSTRAINT `WorkScheduleEvent_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;