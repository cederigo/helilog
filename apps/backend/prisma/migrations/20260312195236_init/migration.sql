-- CreateTable
CREATE TABLE "Helicopter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "manufacturer" TEXT,
    "rotorDiameter" REAL,
    "weight" REAL,
    "totalHours" REAL NOT NULL DEFAULT 0,
    "maintenanceInterval" REAL,
    "lastMaintenance" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "helicopterId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "batteryCycles" INTEGER,
    "flightMode" TEXT,
    "weather" TEXT,
    "temperature" REAL,
    "windSpeed" REAL,
    "notes" TEXT,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Flight_helicopterId_fkey" FOREIGN KEY ("helicopterId") REFERENCES "Helicopter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "helicopterId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "hoursAtMaintenance" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceRecord_helicopterId_fkey" FOREIGN KEY ("helicopterId") REFERENCES "Helicopter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Helicopter_name_key" ON "Helicopter"("name");

-- CreateIndex
CREATE INDEX "Helicopter_name_idx" ON "Helicopter"("name");

-- CreateIndex
CREATE INDEX "Flight_helicopterId_idx" ON "Flight"("helicopterId");

-- CreateIndex
CREATE INDEX "Flight_date_idx" ON "Flight"("date");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_helicopterId_idx" ON "MaintenanceRecord"("helicopterId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_date_idx" ON "MaintenanceRecord"("date");
