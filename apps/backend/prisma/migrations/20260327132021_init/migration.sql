-- CreateTable
CREATE TABLE "Import" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "format" TEXT NOT NULL,
    "description" TEXT,
    "rawDataPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Model" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "maintenanceInterval" REAL,
    "lastMaintenance" DATETIME,
    "importId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Model_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "minVoltage" REAL,
    "maxCurrent" REAL,
    "maxPower" REAL,
    "chargeUsed" REAL,
    "maxRPM" INTEGER,
    "importId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Flight_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Flight_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlightTelemetryPoint" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "flightId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "current" REAL NOT NULL,
    "voltage" REAL NOT NULL,
    "chargeUsed" REAL NOT NULL,
    "headspeed" INTEGER NOT NULL,
    "pwm" INTEGER NOT NULL,
    "temp" REAL NOT NULL,
    CONSTRAINT "FlightTelemetryPoint_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Battery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "cells" INTEGER NOT NULL,
    "importId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Battery_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "hoursAtMaintenance" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceRecord_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Model_name_key" ON "Model"("name");

-- CreateIndex
CREATE INDEX "Model_name_idx" ON "Model"("name");

-- CreateIndex
CREATE INDEX "Flight_modelId_idx" ON "Flight"("modelId");

-- CreateIndex
CREATE INDEX "Flight_date_idx" ON "Flight"("date");

-- CreateIndex
CREATE INDEX "FlightTelemetryPoint_flightId_idx" ON "FlightTelemetryPoint"("flightId");

-- CreateIndex
CREATE UNIQUE INDEX "Battery_name_key" ON "Battery"("name");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_modelId_idx" ON "MaintenanceRecord"("modelId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_date_idx" ON "MaintenanceRecord"("date");
