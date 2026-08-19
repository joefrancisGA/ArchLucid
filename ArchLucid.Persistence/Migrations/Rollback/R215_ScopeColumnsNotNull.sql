/*
  Roll back DbUp 215 — revert RLS scope denormalization columns from NOT NULL to NULL.
*/

SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ContextSnapshots ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshots ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshots ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjects', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ContextSnapshotCanonicalObjects ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotCanonicalObjects ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotCanonicalObjects ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjectProperties', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotWarnings', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ContextSnapshotWarnings ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotWarnings ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotWarnings ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotErrors', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ContextSnapshotErrors ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotErrors ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotErrors ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotSourceHashes', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ContextSnapshotSourceHashes ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotSourceHashes ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.ContextSnapshotSourceHashes ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GraphSnapshots ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshots ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshots ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdges', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GraphSnapshotEdges ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotEdges ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotEdges ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodes', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GraphSnapshotNodes ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotNodes ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotNodes ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodeProperties', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GraphSnapshotNodeProperties ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotNodeProperties ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotNodeProperties ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdgeProperties', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GraphSnapshotEdgeProperties ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotEdgeProperties ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotEdgeProperties ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotWarnings', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GraphSnapshotWarnings ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotWarnings ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GraphSnapshotWarnings ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.FindingRecords ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.FindingRecords ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.FindingRecords ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestAssumptions', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestAssumptions ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestAssumptions ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestAssumptions ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestWarnings', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestWarnings ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestWarnings ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestWarnings ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestDecisions ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestDecisions ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestDecisions ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionEvidenceLinks', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionNodeLinks', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestDecisionNodeLinks ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestDecisionNodeLinks ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestDecisionNodeLinks ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceFindings', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceAppliedRules', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules ALTER COLUMN TenantId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules ALTER COLUMN ProjectId UNIQUEIDENTIFIER NULL;
END;
GO
