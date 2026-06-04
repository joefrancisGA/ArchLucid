/*
  R244: Rollback 244_EvidenceProposalIntegrity.sql.
*/
IF OBJECT_ID(N'dbo.TenantCuratedEvidenceEntries', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'UX_TenantCuratedEvidenceEntries_Tenant_SourceResultId'
         AND object_id = OBJECT_ID(N'dbo.TenantCuratedEvidenceEntries'))
BEGIN
    DROP INDEX UX_TenantCuratedEvidenceEntries_Tenant_SourceResultId ON dbo.TenantCuratedEvidenceEntries;
END;
GO

IF OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AgentResults', N'EvidenceProposalPromotedUtc') IS NOT NULL
    ALTER TABLE dbo.AgentResults DROP COLUMN EvidenceProposalPromotedUtc;
GO
