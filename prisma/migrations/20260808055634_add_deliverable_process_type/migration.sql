-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deliverable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "processType" TEXT NOT NULL DEFAULT 'TCU',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "studentProfileId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Deliverable_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deliverable_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deliverable" ("comment", "description", "fileName", "id", "reviewedAt", "reviewedById", "status", "studentProfileId", "submittedAt", "title") SELECT "comment", "description", "fileName", "id", "reviewedAt", "reviewedById", "status", "studentProfileId", "submittedAt", "title" FROM "Deliverable";
DROP TABLE "Deliverable";
ALTER TABLE "new_Deliverable" RENAME TO "Deliverable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
