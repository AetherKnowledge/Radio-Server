/*
  Warnings:

  - You are about to drop the column `signalType` on the `Station` table. All the data in the column will be lost.
  - Added the required column `bandType` to the `Station` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Station" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "streamUrl" TEXT NOT NULL,
    "bandType" TEXT NOT NULL,
    "lowestFrequency" REAL NOT NULL,
    "highestFrequency" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Station" ("createdAt", "highestFrequency", "id", "lowestFrequency", "name", "streamUrl", "updatedAt") SELECT "createdAt", "highestFrequency", "id", "lowestFrequency", "name", "streamUrl", "updatedAt" FROM "Station";
DROP TABLE "Station";
ALTER TABLE "new_Station" RENAME TO "Station";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
