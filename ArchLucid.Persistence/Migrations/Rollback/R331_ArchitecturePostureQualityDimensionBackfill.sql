/*
  R331: Rollback 331_ArchitecturePostureQualityDimensionBackfill.sql — data-only backfill; no schema to restore.
  Re-running the forward migration is idempotent; row-level QualityDimension values are not cleared on rollback.
*/

SET NOCOUNT ON;
GO
