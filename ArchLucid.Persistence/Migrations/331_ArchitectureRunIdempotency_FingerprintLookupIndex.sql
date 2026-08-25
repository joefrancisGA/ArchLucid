-- TB-2373: accelerate recent request-fingerprint dedupe lookups on create-run.
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ArchitectureRunIdempotency_Scope_Fingerprint_CreatedUtc'
      AND object_id = OBJECT_ID(N'dbo.ArchitectureRunIdempotency'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ArchitectureRunIdempotency_Scope_Fingerprint_CreatedUtc
        ON dbo.ArchitectureRunIdempotency (TenantId, WorkspaceId, ProjectId, RequestFingerprint, CreatedUtc DESC);
END;
GO
