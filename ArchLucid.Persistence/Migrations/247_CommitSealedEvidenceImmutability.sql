-- TB-303 / ADR 0039: commit-sealed evidence immutability (DENY UPDATE/DELETE for [ArchLucidApp]).
-- Post-commit agent-result enrichments (calibration, IaC stubs, proposal promotion) use dbo.AgentResultEnrichments.

IF OBJECT_ID(N'dbo.AgentResultEnrichments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgentResultEnrichments
    (
        ResultId                      NVARCHAR(64)  NOT NULL PRIMARY KEY,
        CalibratedConfidence          FLOAT         NULL,
        EnrichedResultJson            NVARCHAR(MAX) NULL,
        EvidenceProposalPromotedUtc   DATETIME2     NULL,
        UpdatedUtc                    DATETIME2     NOT NULL,
        CONSTRAINT FK_AgentResultEnrichments_Result
            FOREIGN KEY (ResultId) REFERENCES dbo.AgentResults (ResultId)
    );
END;
GO

IF OBJECT_ID(N'dbo.AgentResultEnrichments', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.AgentResults', N'U') IS NOT NULL
BEGIN
    INSERT INTO dbo.AgentResultEnrichments (ResultId, CalibratedConfidence, EvidenceProposalPromotedUtc, UpdatedUtc)
    SELECT ar.ResultId,
           ar.CalibratedConfidence,
           ar.EvidenceProposalPromotedUtc,
           SYSUTCDATETIME()
    FROM dbo.AgentResults AS ar
    WHERE (ar.CalibratedConfidence IS NOT NULL OR ar.EvidenceProposalPromotedUtc IS NOT NULL)
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.AgentResultEnrichments AS e
          WHERE e.ResultId = ar.ResultId);
END;
GO

IF OBJECT_ID(N'dbo.AgentEvidencePackages', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'UX_AgentEvidencePackages_RunId'
         AND object_id = OBJECT_ID(N'dbo.AgentEvidencePackages'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_AgentEvidencePackages_RunId
        ON dbo.AgentEvidencePackages (RunId);
END;
GO

DECLARE @SealedTables TABLE (TableName SYSNAME NOT NULL PRIMARY KEY);
INSERT INTO @SealedTables (TableName)
VALUES
    (N'dbo.AuditEvents'),
    (N'dbo.AgentResults'),
    (N'dbo.AgentEvidencePackages'),
    /* dbo.DecisionTraces dropped in migration 296; authority audits use dbo.DecisioningTraces. */
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
       AND NOT EXISTS (
           SELECT 1
           FROM sys.database_permissions AS dp
           INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
           WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
             AND dp.major_id = OBJECT_ID(@TableName)
             AND dp.permission_name = N'UPDATE'
             AND dp.state_desc = N'DENY'
             AND gp.name = N'ArchLucidApp')
    BEGIN
        SET @Sql = N'DENY UPDATE ON ' + @TableName + N' TO [ArchLucidApp];';
        EXEC sp_executesql @Sql;
    END;

    IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
       AND OBJECT_ID(@TableName, N'U') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM sys.database_permissions AS dp
           INNER JOIN sys.database_principals AS gp ON dp.grantee_principal_id = gp.principal_id
           WHERE dp.class_desc = N'OBJECT_OR_COLUMN'
             AND dp.major_id = OBJECT_ID(@TableName)
             AND dp.permission_name = N'DELETE'
             AND dp.state_desc = N'DENY'
             AND gp.name = N'ArchLucidApp')
    BEGIN
        SET @Sql = N'DENY DELETE ON ' + @TableName + N' TO [ArchLucidApp];';
        EXEC sp_executesql @Sql;
    END;

    FETCH NEXT FROM sealed_cursor INTO @TableName;
END;

CLOSE sealed_cursor;
DEALLOCATE sealed_cursor;
GO
