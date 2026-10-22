-- Rollback TB-303: remove sealed-table DENY grants and enrichment overlay (destructive to enrichment-only data).

IF OBJECT_ID(N'dbo.AgentResultEnrichments', N'U') IS NOT NULL
    DROP TABLE dbo.AgentResultEnrichments;
GO

DECLARE @SealedTables TABLE (TableName SYSNAME NOT NULL PRIMARY KEY);
INSERT INTO @SealedTables (TableName)
VALUES
    (N'dbo.AuditEvents'),
    (N'dbo.AgentResults'),
    (N'dbo.AgentEvidencePackages'),
    (N'dbo.DecisionTraces'),
    (N'dbo.DecisionNodes'),
    (N'dbo.DecisioningTraces'),
    (N'dbo.ContextSnapshots'),
    (N'dbo.ContextSnapshotCanonicalObjects'),
    (N'dbo.ContextSnapshotCanonicalObjectProperties'),
    (N'dbo.ContextSnapshotWarnings'),
    (N'dbo.ContextSnapshotErrors'),
    (N'dbo.ContextSnapshotSourceHashes'),
    (N'dbo.GraphSnapshots'),
    (N'dbo.GraphSnapshotEdges'),
    (N'dbo.GraphSnapshotNodes'),
    (N'dbo.GraphSnapshotNodeProperties'),
    (N'dbo.GraphSnapshotEdgeProperties'),
    (N'dbo.GraphSnapshotWarnings'),
    (N'dbo.FindingsSnapshots'),
    (N'dbo.FindingRecords'),
    (N'dbo.FindingRelatedNodes'),
    (N'dbo.FindingRecommendedActions'),
    (N'dbo.FindingProperties'),
    (N'dbo.FindingTraceGraphNodesExamined'),
    (N'dbo.FindingTraceRulesApplied'),
    (N'dbo.FindingTraceDecisionsTaken'),
    (N'dbo.FindingTraceAlternativePaths'),
    (N'dbo.FindingTraceNotes'),
    (N'dbo.GoldenManifests'),
    (N'dbo.GoldenManifestAssumptions'),
    (N'dbo.GoldenManifestWarnings'),
    (N'dbo.GoldenManifestDecisions'),
    (N'dbo.GoldenManifestDecisionEvidenceLinks'),
    (N'dbo.GoldenManifestDecisionNodeLinks'),
    (N'dbo.GoldenManifestProvenanceSourceFindings'),
    (N'dbo.GoldenManifestProvenanceSourceGraphNodes'),
    (N'dbo.GoldenManifestProvenanceAppliedRules'),
    (N'dbo.ArtifactBundles'),
    (N'dbo.ArtifactBundleArtifacts'),
    (N'dbo.ArtifactBundleArtifactMetadata'),
    (N'dbo.ArtifactBundleArtifactDecisionLinks'),
    (N'dbo.ArtifactBundleTraceGenerators'),
    (N'dbo.ArtifactBundleTraceDecisionLinks'),
    (N'dbo.ArtifactBundleTraceNotes');

DECLARE @TableName SYSNAME;
DECLARE @Sql NVARCHAR(MAX);

DECLARE sealed_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT TableName FROM @SealedTables;

OPEN sealed_cursor;
FETCH NEXT FROM sealed_cursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
       AND OBJECT_ID(@TableName, N'U') IS NOT NULL
    BEGIN
        SET @Sql = N'REVOKE UPDATE ON ' + @TableName + N' FROM [ArchLucidApp];';
        EXEC sp_executesql @Sql;
        SET @Sql = N'REVOKE DELETE ON ' + @TableName + N' FROM [ArchLucidApp];';
        EXEC sp_executesql @Sql;
    END;

    FETCH NEXT FROM sealed_cursor INTO @TableName;
END;

CLOSE sealed_cursor;
DEALLOCATE sealed_cursor;
GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'UX_AgentEvidencePackages_RunId'
         AND object_id = OBJECT_ID(N'dbo.AgentEvidencePackages'))
    DROP INDEX UX_AgentEvidencePackages_RunId ON dbo.AgentEvidencePackages;
GO
