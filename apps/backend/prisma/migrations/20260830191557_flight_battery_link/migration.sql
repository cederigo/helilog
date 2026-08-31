-- AlterTable: SQLite supports ADD COLUMN with a REFERENCES clause as long as the
-- new column defaults to NULL, so no table rebuild is needed here.
ALTER TABLE "Flight" ADD COLUMN "batteryId" INTEGER REFERENCES "Battery" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Flight_batteryId_idx" ON "Flight"("batteryId");
