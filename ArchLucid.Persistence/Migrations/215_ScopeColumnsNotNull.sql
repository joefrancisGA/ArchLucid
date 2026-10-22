/*
  Improvement #32 — enforce NOT NULL on RLS scope denormalization columns.

  Backfills from parent rows where scope is null, then aborts if any nulls remain, then ALTER NOT NULL.
*/

SET NOCOUNT ON;

/* ---- Backfill from parents ---- */
IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL
BEGIN
    UPDATE cs
    SET
        TenantId = COALESCE(cs.TenantId, r.TenantId),
        WorkspaceId = COALESCE(cs.WorkspaceId, r.WorkspaceId),
        ScopeProjectId = COALESCE(cs.ScopeProjectId, r.ScopeProjectId)
    FROM dbo.ContextSnapshots AS cs
    INNER JOIN dbo.Runs AS r ON r.RunId = cs.RunId
    WHERE cs.TenantId IS NULL OR cs.WorkspaceId IS NULL OR cs.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjects', N'U') IS NOT NULL
BEGIN
    UPDATE o
    SET
        TenantId = COALESCE(o.TenantId, p.TenantId),
        WorkspaceId = COALESCE(o.WorkspaceId, p.WorkspaceId),
        ScopeProjectId = COALESCE(o.ScopeProjectId, p.ScopeProjectId)
    FROM dbo.ContextSnapshotCanonicalObjects AS o
    INNER JOIN dbo.ContextSnapshots AS p ON p.SnapshotId = o.SnapshotId
    WHERE o.TenantId IS NULL OR o.WorkspaceId IS NULL OR o.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjectProperties', N'U') IS NOT NULL
BEGIN
    UPDATE pr
    SET
        TenantId = COALESCE(pr.TenantId, o.TenantId),
        WorkspaceId = COALESCE(pr.WorkspaceId, o.WorkspaceId),
        ScopeProjectId = COALESCE(pr.ScopeProjectId, o.ScopeProjectId)
    FROM dbo.ContextSnapshotCanonicalObjectProperties AS pr
    INNER JOIN dbo.ContextSnapshotCanonicalObjects AS o ON o.CanonicalObjectRowId = pr.CanonicalObjectRowId
    WHERE pr.TenantId IS NULL OR pr.WorkspaceId IS NULL OR pr.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotWarnings', N'U') IS NOT NULL
BEGIN
    UPDATE w
    SET
        TenantId = COALESCE(w.TenantId, p.TenantId),
        WorkspaceId = COALESCE(w.WorkspaceId, p.WorkspaceId),
        ScopeProjectId = COALESCE(w.ScopeProjectId, p.ScopeProjectId)
    FROM dbo.ContextSnapshotWarnings AS w
    INNER JOIN dbo.ContextSnapshots AS p ON p.SnapshotId = w.SnapshotId
    WHERE w.TenantId IS NULL OR w.WorkspaceId IS NULL OR w.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotErrors', N'U') IS NOT NULL
BEGIN
    UPDATE e
    SET
        TenantId = COALESCE(e.TenantId, p.TenantId),
        WorkspaceId = COALESCE(e.WorkspaceId, p.WorkspaceId),
        ScopeProjectId = COALESCE(e.ScopeProjectId, p.ScopeProjectId)
    FROM dbo.ContextSnapshotErrors AS e
    INNER JOIN dbo.ContextSnapshots AS p ON p.SnapshotId = e.SnapshotId
    WHERE e.TenantId IS NULL OR e.WorkspaceId IS NULL OR e.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotSourceHashes', N'U') IS NOT NULL
BEGIN
    UPDATE h
    SET
        TenantId = COALESCE(h.TenantId, p.TenantId),
        WorkspaceId = COALESCE(h.WorkspaceId, p.WorkspaceId),
        ScopeProjectId = COALESCE(h.ScopeProjectId, p.ScopeProjectId)
    FROM dbo.ContextSnapshotSourceHashes AS h
    INNER JOIN dbo.ContextSnapshots AS p ON p.SnapshotId = h.SnapshotId
    WHERE h.TenantId IS NULL OR h.WorkspaceId IS NULL OR h.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
BEGIN
    UPDATE g
    SET
        TenantId = COALESCE(g.TenantId, p.TenantId),
        WorkspaceId = COALESCE(g.WorkspaceId, p.WorkspaceId),
        ScopeProjectId = COALESCE(g.ScopeProjectId, p.ScopeProjectId)
    FROM dbo.GraphSnapshots AS g
    INNER JOIN dbo.ContextSnapshots AS p ON p.SnapshotId = g.ContextSnapshotId
    WHERE g.TenantId IS NULL OR g.WorkspaceId IS NULL OR g.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdges', N'U') IS NOT NULL
BEGIN
    UPDATE e
    SET
        TenantId = COALESCE(e.TenantId, g.TenantId),
        WorkspaceId = COALESCE(e.WorkspaceId, g.WorkspaceId),
        ScopeProjectId = COALESCE(e.ScopeProjectId, g.ScopeProjectId)
    FROM dbo.GraphSnapshotEdges AS e
    INNER JOIN dbo.GraphSnapshots AS g ON g.GraphSnapshotId = e.GraphSnapshotId
    WHERE e.TenantId IS NULL OR e.WorkspaceId IS NULL OR e.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodes', N'U') IS NOT NULL
BEGIN
    UPDATE n
    SET
        TenantId = COALESCE(n.TenantId, g.TenantId),
        WorkspaceId = COALESCE(n.WorkspaceId, g.WorkspaceId),
        ScopeProjectId = COALESCE(n.ScopeProjectId, g.ScopeProjectId)
    FROM dbo.GraphSnapshotNodes AS n
    INNER JOIN dbo.GraphSnapshots AS g ON g.GraphSnapshotId = n.GraphSnapshotId
    WHERE n.TenantId IS NULL OR n.WorkspaceId IS NULL OR n.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodeProperties', N'U') IS NOT NULL
BEGIN
    UPDATE np
    SET
        TenantId = COALESCE(np.TenantId, n.TenantId),
        WorkspaceId = COALESCE(np.WorkspaceId, n.WorkspaceId),
        ScopeProjectId = COALESCE(np.ScopeProjectId, n.ScopeProjectId)
    FROM dbo.GraphSnapshotNodeProperties AS np
    INNER JOIN dbo.GraphSnapshotNodes AS n ON n.GraphNodeRowId = np.GraphNodeRowId
    WHERE np.TenantId IS NULL OR np.WorkspaceId IS NULL OR np.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdgeProperties', N'U') IS NOT NULL
BEGIN
    UPDATE ep
    SET
        TenantId = COALESCE(ep.TenantId, e.TenantId),
        WorkspaceId = COALESCE(ep.WorkspaceId, e.WorkspaceId),
        ScopeProjectId = COALESCE(ep.ScopeProjectId, e.ScopeProjectId)
    FROM dbo.GraphSnapshotEdgeProperties AS ep
    INNER JOIN dbo.GraphSnapshotEdges AS e
        ON e.GraphSnapshotId = ep.GraphSnapshotId AND e.EdgeId = ep.EdgeId
    WHERE ep.TenantId IS NULL OR ep.WorkspaceId IS NULL OR ep.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotWarnings', N'U') IS NOT NULL
BEGIN
    UPDATE w
    SET
        TenantId = COALESCE(w.TenantId, g.TenantId),
        WorkspaceId = COALESCE(w.WorkspaceId, g.WorkspaceId),
        ScopeProjectId = COALESCE(w.ScopeProjectId, g.ScopeProjectId)
    FROM dbo.GraphSnapshotWarnings AS w
    INNER JOIN dbo.GraphSnapshots AS g ON g.GraphSnapshotId = w.GraphSnapshotId
    WHERE w.TenantId IS NULL OR w.WorkspaceId IS NULL OR w.ScopeProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
BEGIN
    UPDATE f
    SET
        TenantId = COALESCE(f.TenantId, s.TenantId),
        WorkspaceId = COALESCE(f.WorkspaceId, s.WorkspaceId),
        ProjectId = COALESCE(f.ProjectId, s.ProjectId)
    FROM dbo.FindingRecords AS f
    INNER JOIN dbo.FindingsSnapshots AS s ON s.FindingsSnapshotId = f.FindingsSnapshotId
    WHERE f.TenantId IS NULL OR f.WorkspaceId IS NULL OR f.ProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestAssumptions', N'U') IS NOT NULL
BEGIN
    UPDATE c
    SET
        TenantId = COALESCE(c.TenantId, m.TenantId),
        WorkspaceId = COALESCE(c.WorkspaceId, m.WorkspaceId),
        ProjectId = COALESCE(c.ProjectId, m.ProjectId)
    FROM dbo.GoldenManifestAssumptions AS c
    INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = c.ManifestId
    WHERE c.TenantId IS NULL OR c.WorkspaceId IS NULL OR c.ProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestWarnings', N'U') IS NOT NULL
BEGIN
    UPDATE c
    SET
        TenantId = COALESCE(c.TenantId, m.TenantId),
        WorkspaceId = COALESCE(c.WorkspaceId, m.WorkspaceId),
        ProjectId = COALESCE(c.ProjectId, m.ProjectId)
    FROM dbo.GoldenManifestWarnings AS c
    INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = c.ManifestId
    WHERE c.TenantId IS NULL OR c.WorkspaceId IS NULL OR c.ProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
BEGIN
    UPDATE c
    SET
        TenantId = COALESCE(c.TenantId, m.TenantId),
        WorkspaceId = COALESCE(c.WorkspaceId, m.WorkspaceId),
        ProjectId = COALESCE(c.ProjectId, m.ProjectId)
    FROM dbo.GoldenManifestDecisions AS c
    INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = c.ManifestId
    WHERE c.TenantId IS NULL OR c.WorkspaceId IS NULL OR c.ProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionEvidenceLinks', N'U') IS NOT NULL
BEGIN
    UPDATE c
    SET
        TenantId = COALESCE(c.TenantId, m.TenantId),
        WorkspaceId = COALESCE(c.WorkspaceId, m.WorkspaceId),
        ProjectId = COALESCE(c.ProjectId, m.ProjectId)
    FROM dbo.GoldenManifestDecisionEvidenceLinks AS c
    INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = c.ManifestId
    WHERE c.TenantId IS NULL OR c.WorkspaceId IS NULL OR c.ProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionNodeLinks', N'U') IS NOT NULL
BEGIN
    UPDATE c
    SET
        TenantId = COALESCE(c.TenantId, m.TenantId),
        WorkspaceId = COALESCE(c.WorkspaceId, m.WorkspaceId),
        ProjectId = COALESCE(c.ProjectId, m.ProjectId)
    FROM dbo.GoldenManifestDecisionNodeLinks AS c
    INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = c.ManifestId
    WHERE c.TenantId IS NULL OR c.WorkspaceId IS NULL OR c.ProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceFindings', N'U') IS NOT NULL
BEGIN
    UPDATE c
    SET
        TenantId = COALESCE(c.TenantId, m.TenantId),
        WorkspaceId = COALESCE(c.WorkspaceId, m.WorkspaceId),
        ProjectId = COALESCE(c.ProjectId, m.ProjectId)
    FROM dbo.GoldenManifestProvenanceSourceFindings AS c
    INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = c.ManifestId
    WHERE c.TenantId IS NULL OR c.WorkspaceId IS NULL OR c.ProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'U') IS NOT NULL
BEGIN
    UPDATE c
    SET
        TenantId = COALESCE(c.TenantId, m.TenantId),
        WorkspaceId = COALESCE(c.WorkspaceId, m.WorkspaceId),
        ProjectId = COALESCE(c.ProjectId, m.ProjectId)
    FROM dbo.GoldenManifestProvenanceSourceGraphNodes AS c
    INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = c.ManifestId
    WHERE c.TenantId IS NULL OR c.WorkspaceId IS NULL OR c.ProjectId IS NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceAppliedRules', N'U') IS NOT NULL
BEGIN
    UPDATE c
    SET
        TenantId = COALESCE(c.TenantId, m.TenantId),
        WorkspaceId = COALESCE(c.WorkspaceId, m.WorkspaceId),
        ProjectId = COALESCE(c.ProjectId, m.ProjectId)
    FROM dbo.GoldenManifestProvenanceAppliedRules AS c
    INNER JOIN dbo.GoldenManifests AS m ON m.ManifestId = c.ManifestId
    WHERE c.TenantId IS NULL OR c.WorkspaceId IS NULL OR c.ProjectId IS NULL;
END;
GO

/* ---- Pre-check + NOT NULL enforcement ---- */
IF OBJECT_ID(N'dbo.ContextSnapshots', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.ContextSnapshots WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 ContextSnapshots scope nulls remain.', 1;

    ALTER TABLE dbo.ContextSnapshots ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshots ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshots ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjects', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.ContextSnapshotCanonicalObjects WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 ContextSnapshotCanonicalObjects scope nulls remain.', 1;

    ALTER TABLE dbo.ContextSnapshotCanonicalObjects ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotCanonicalObjects ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotCanonicalObjects ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotCanonicalObjectProperties', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.ContextSnapshotCanonicalObjectProperties WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 ContextSnapshotCanonicalObjectProperties scope nulls remain.', 1;

    ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotCanonicalObjectProperties ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotWarnings', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.ContextSnapshotWarnings WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 ContextSnapshotWarnings scope nulls remain.', 1;

    ALTER TABLE dbo.ContextSnapshotWarnings ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotWarnings ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotWarnings ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotErrors', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.ContextSnapshotErrors WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 ContextSnapshotErrors scope nulls remain.', 1;

    ALTER TABLE dbo.ContextSnapshotErrors ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotErrors ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotErrors ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.ContextSnapshotSourceHashes', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.ContextSnapshotSourceHashes WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 ContextSnapshotSourceHashes scope nulls remain.', 1;

    ALTER TABLE dbo.ContextSnapshotSourceHashes ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotSourceHashes ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.ContextSnapshotSourceHashes ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshots', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GraphSnapshots WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 GraphSnapshots scope nulls remain.', 1;

    ALTER TABLE dbo.GraphSnapshots ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshots ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshots ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdges', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GraphSnapshotEdges WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 GraphSnapshotEdges scope nulls remain.', 1;

    ALTER TABLE dbo.GraphSnapshotEdges ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotEdges ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotEdges ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodes', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GraphSnapshotNodes WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 GraphSnapshotNodes scope nulls remain.', 1;

    ALTER TABLE dbo.GraphSnapshotNodes ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotNodes ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotNodes ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotNodeProperties', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GraphSnapshotNodeProperties WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 GraphSnapshotNodeProperties scope nulls remain.', 1;

    ALTER TABLE dbo.GraphSnapshotNodeProperties ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotNodeProperties ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotNodeProperties ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotEdgeProperties', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GraphSnapshotEdgeProperties WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 GraphSnapshotEdgeProperties scope nulls remain.', 1;

    ALTER TABLE dbo.GraphSnapshotEdgeProperties ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotEdgeProperties ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotEdgeProperties ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GraphSnapshotWarnings', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GraphSnapshotWarnings WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ScopeProjectId IS NULL)
        THROW 50032, N'#32 GraphSnapshotWarnings scope nulls remain.', 1;

    ALTER TABLE dbo.GraphSnapshotWarnings ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotWarnings ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GraphSnapshotWarnings ALTER COLUMN ScopeProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.FindingRecords', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.FindingRecords WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 FindingRecords scope nulls remain.', 1;

    ALTER TABLE dbo.FindingRecords ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.FindingRecords ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.FindingRecords ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestAssumptions', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GoldenManifestAssumptions WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 GoldenManifestAssumptions scope nulls remain.', 1;

    ALTER TABLE dbo.GoldenManifestAssumptions ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestAssumptions ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestAssumptions ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestWarnings', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GoldenManifestWarnings WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 GoldenManifestWarnings scope nulls remain.', 1;

    ALTER TABLE dbo.GoldenManifestWarnings ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestWarnings ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestWarnings ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GoldenManifestDecisions WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 GoldenManifestDecisions scope nulls remain.', 1;

    ALTER TABLE dbo.GoldenManifestDecisions ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestDecisions ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestDecisions ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionEvidenceLinks', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GoldenManifestDecisionEvidenceLinks WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 GoldenManifestDecisionEvidenceLinks scope nulls remain.', 1;

    ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestDecisionEvidenceLinks ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisionNodeLinks', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GoldenManifestDecisionNodeLinks WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 GoldenManifestDecisionNodeLinks scope nulls remain.', 1;

    ALTER TABLE dbo.GoldenManifestDecisionNodeLinks ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestDecisionNodeLinks ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestDecisionNodeLinks ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceFindings', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GoldenManifestProvenanceSourceFindings WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 GoldenManifestProvenanceSourceFindings scope nulls remain.', 1;

    ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceSourceFindings ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceSourceGraphNodes', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GoldenManifestProvenanceSourceGraphNodes WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 GoldenManifestProvenanceSourceGraphNodes scope nulls remain.', 1;

    ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceSourceGraphNodes ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestProvenanceAppliedRules', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.GoldenManifestProvenanceAppliedRules WHERE TenantId IS NULL OR WorkspaceId IS NULL OR ProjectId IS NULL)
        THROW 50032, N'#32 GoldenManifestProvenanceAppliedRules scope nulls remain.', 1;

    ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules ALTER COLUMN TenantId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules ALTER COLUMN WorkspaceId UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.GoldenManifestProvenanceAppliedRules ALTER COLUMN ProjectId UNIQUEIDENTIFIER NOT NULL;
END;
GO
