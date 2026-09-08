/*
  374: TB-2034 — finding verification idempotency index (package + snapshot pair).
*/

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_FindingVerificationReports_Idempotency'
      AND object_id = OBJECT_ID(N'dbo.FindingVerificationReports'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_FindingVerificationReports_Idempotency
        ON dbo.FindingVerificationReports (
            TenantId,
            WorkspaceId,
            ScopeProjectId,
            RunId,
            SourceFindingsSnapshotId,
            VerificationFindingsSnapshotId,
            CreatedUtc DESC);
END;
GO
