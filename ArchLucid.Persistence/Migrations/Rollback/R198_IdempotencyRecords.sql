/*
  R198: Rollback 198_IdempotencyRecords.sql — drop dbo.IdempotencyRecords when present.
*/

IF OBJECT_ID(N'dbo.IdempotencyRecords', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.IdempotencyRecords;
END;
GO
