/* 370 — Finding current disposition pointer with ROWVERSION (ADR 0076 / DR-08).
   Append-only FindingReviewEvents unchanged; this table holds the single current pointer per finding. */

IF OBJECT_ID(N'dbo.FindingCurrentDispositions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FindingCurrentDispositions
    (
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        FindingId NVARCHAR(128) NOT NULL,
        CurrentEventId UNIQUEIDENTIFIER NOT NULL,
        RowVersionStamp ROWVERSION NOT NULL,
        CONSTRAINT PK_FindingCurrentDispositions PRIMARY KEY (TenantId, WorkspaceId, ProjectId, FindingId),
        CONSTRAINT FK_FindingCurrentDispositions_Event FOREIGN KEY (CurrentEventId)
            REFERENCES dbo.FindingReviewEvents (EventId)
    );

    CREATE NONCLUSTERED INDEX IX_FindingCurrentDispositions_Event
        ON dbo.FindingCurrentDispositions (CurrentEventId);
END;

/* Backfill current pointer from latest disposition event per scoped finding. */
IF OBJECT_ID(N'dbo.FindingCurrentDispositions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
BEGIN
    INSERT INTO dbo.FindingCurrentDispositions (TenantId, WorkspaceId, ProjectId, FindingId, CurrentEventId)
    SELECT TenantId, WorkspaceId, ProjectId, FindingId, EventId
    FROM (
        SELECT
            e.TenantId,
            e.WorkspaceId,
            e.ProjectId,
            e.FindingId,
            e.EventId,
            ROW_NUMBER() OVER (
                PARTITION BY e.TenantId, e.WorkspaceId, e.ProjectId, e.FindingId
                ORDER BY e.OccurredAtUtc DESC, e.EventId DESC) AS rn
        FROM dbo.FindingReviewEvents AS e
        WHERE e.Disposition IS NOT NULL
    ) AS ranked
    WHERE ranked.rn = 1
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.FindingCurrentDispositions AS c
          WHERE c.TenantId = ranked.TenantId
            AND c.WorkspaceId = ranked.WorkspaceId
            AND c.ProjectId = ranked.ProjectId
            AND c.FindingId = ranked.FindingId);
END;
