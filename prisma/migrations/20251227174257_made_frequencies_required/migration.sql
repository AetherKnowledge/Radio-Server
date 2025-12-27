/*
  Warnings:

  - Made the column `highestFrequency` on table `Station` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lowestFrequency` on table `Station` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Station" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "streamUrl" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "lowestFrequency" REAL NOT NULL,
    "highestFrequency" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Station" ("createdAt", "highestFrequency", "id", "lowestFrequency", "name", "signalType", "streamUrl", "updatedAt") SELECT "createdAt", "highestFrequency", "id", "lowestFrequency", "name", "signalType", "streamUrl", "updatedAt" FROM "Station";
DROP TABLE "Station";
ALTER TABLE "new_Station" RENAME TO "Station";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
