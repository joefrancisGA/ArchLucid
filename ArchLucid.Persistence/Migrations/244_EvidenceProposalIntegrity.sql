-- TB-274 / 5DH-evidence-p0: promotion timestamp, idempotent promote guard, catalog source-result uniqueness.

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.AgentResults', N'EvidenceProposalPromotedUtc') IS NULL
        ALTER TABLE dbo.AgentResults ADD EvidenceProposalPromotedUtc DATETIME2 NULL;
END
GO

IF OBJECT_ID(N'dbo.TenantCuratedEvidenceEntries', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'UX_TenantCuratedEvidenceEntries_Tenant_SourceResultId'
         AND object_id = OBJECT_ID(N'dbo.TenantCuratedEvidenceEntries'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TenantCuratedEvidenceEntries_Tenant_SourceResultId
        ON dbo.TenantCuratedEvidenceEntries (TenantId, SourceResultId)
        WHERE SourceResultId IS NOT NULL;
END
GO
