/*
  367: DA-12 — conservative link of legacy DraftRequests to existing run architecture identities.
  Idempotent set-based pass; tenant isolation enforced via scoped join keys.
*/

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ArchitectureId') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'SpawnedRunId') IS NOT NULL
BEGIN
    DECLARE @runTable sysname =
        CASE
            WHEN OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL THEN N'dbo.Reviews'
            WHEN OBJECT_ID(N'dbo.Runs', N'U') IS NOT NULL THEN N'dbo.Runs'
        END;

    IF @runTable IS NOT NULL
    BEGIN
        DECLARE @sql NVARCHAR(MAX) = N'
            UPDATE d
            SET d.ArchitectureId = r.ArchitectureId,
                d.UpdatedUtc = SYSUTCDATETIME()
            FROM dbo.DraftRequests AS d
            INNER JOIN ' + @runTable + N' AS r
                ON r.TenantId = d.TenantId
               AND r.WorkspaceId = d.WorkspaceId
               AND r.ScopeProjectId = d.ProjectId
               AND (
                    r.RunId = TRY_CONVERT(UNIQUEIDENTIFIER, d.SpawnedRunId)
                    OR r.RunId = TRY_CONVERT(UNIQUEIDENTIFIER, REPLACE(d.SpawnedRunId, ''-'', ''''))
               )
            WHERE d.ArchitectureId IS NULL
              AND d.SpawnedRunId IS NOT NULL
              AND r.ArchitectureId IS NOT NULL
              AND r.ArchivedUtc IS NULL;';

        EXEC sp_executesql @sql;
    END
END;
GO
