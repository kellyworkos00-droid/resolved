-- Migration: Add marketing visit forms workflow
-- Created: 2026-04-25

-- ============================================================================
-- MARKETING VISIT FORMS TABLE
-- Captures customer visit submissions from marketing and sales teams.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "marketing_visit_forms" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT,
  "customerEmail" TEXT,
  "siteName" TEXT NOT NULL,
  "locationDescription" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "photoUrl" TEXT,
  "knowsElegant" BOOLEAN NOT NULL,
  "clientFeedback" TEXT,
  "routeName" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "editCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "marketing_visit_forms_createdBy_fkey"
    FOREIGN KEY ("createdBy")
    REFERENCES "users" ("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "marketing_visit_forms_createdBy_idx"
  ON "marketing_visit_forms"("createdBy");

CREATE INDEX IF NOT EXISTS "marketing_visit_forms_createdAt_idx"
  ON "marketing_visit_forms"("createdAt");

-- Migration completed successfully