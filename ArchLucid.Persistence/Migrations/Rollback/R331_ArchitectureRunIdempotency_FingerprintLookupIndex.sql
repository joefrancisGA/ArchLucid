/* Rollback for migration 331: drop request-fingerprint dedupe lookup index. */

IF OBJECT_ID(N'dbo.ArchitectureRunIdempotency', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_ArchitectureRunIdempotency_Scope_Fingerprint_CreatedUtc'
         AND object_id = OBJECT_ID(N'dbo.ArchitectureRunIdempotency'))
BEGIN
    DROP INDEX IX_ArchitectureRunIdempotency_Scope_Fingerprint_CreatedUtc ON dbo.ArchitectureRunIdempotency;
END;
GO
