/*
  R332: Rollback 332_ArchitecturePostureQualityDimensionBackfill.sql

  Forward migration backfills FindingRecords.QualityDimension from category map and
  specialist property bags. That data correction is not safely reversible without
  losing audit context, so rollback is intentionally a no-op.
*/

GO
