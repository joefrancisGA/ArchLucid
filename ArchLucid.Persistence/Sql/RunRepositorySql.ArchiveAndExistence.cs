namespace ArchLucid.Persistence.Sql;

internal static partial class RunRepositorySql
{
    public const string ArchiveRunsCreatedBefore = """
                                                   DECLARE @ArchivedScratch TABLE (
                                                       RunId UNIQUEIDENTIFIER NOT NULL,
                                                       TenantId UNIQUEIDENTIFIER NOT NULL,
                                                       WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                                                       ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                                                   );

                                                   DECLARE @Archived dbo.ArchivedRunIdList;

                                                   UPDATE dbo.Runs
                                                   SET ArchivedUtc = SYSUTCDATETIME()
                                                   OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                                                   INTO @ArchivedScratch
                                                   WHERE ArchivedUtc IS NULL AND CreatedUtc < @Cutoff;

                                                   INSERT INTO @Archived (RunId)
                                                   SELECT RunId FROM @ArchivedScratch;

                                                   SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @ArchivedScratch;

                                                   EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived;
                                                   """;

    public const string ArchiveRunsCreatedBeforeInScope = """
                                                            DECLARE @ArchivedScratch TABLE (
                                                                RunId UNIQUEIDENTIFIER NOT NULL,
                                                                TenantId UNIQUEIDENTIFIER NOT NULL,
                                                                WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                                                                ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                                                            );

                                                            DECLARE @Archived dbo.ArchivedRunIdList;

                                                            UPDATE dbo.Runs
                                                            SET ArchivedUtc = SYSUTCDATETIME()
                                                            OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                                                            INTO @ArchivedScratch
                                                            WHERE ArchivedUtc IS NULL
                                                              AND CreatedUtc < @Cutoff
                                                              AND TenantId = @TenantId
                                                              AND WorkspaceId = @WorkspaceId
                                                              AND ScopeProjectId = @ScopeProjectId;

                                                            INSERT INTO @Archived (RunId)
                                                            SELECT RunId FROM @ArchivedScratch;

                                                            SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @ArchivedScratch;

                                                            EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived;
                                                            """;

    public const string ArchiveRunsByIds = """
                                           DECLARE @ArchivedScratch TABLE (
                                               RunId UNIQUEIDENTIFIER NOT NULL,
                                               TenantId UNIQUEIDENTIFIER NOT NULL,
                                               WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                                               ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                                           );

                                           DECLARE @Archived dbo.ArchivedRunIdList;

                                           UPDATE dbo.Runs
                                           SET ArchivedUtc = SYSUTCDATETIME()
                                           OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                                           INTO @ArchivedScratch
                                           WHERE RunId IN @RunIds AND ArchivedUtc IS NULL;

                                           INSERT INTO @Archived (RunId)
                                           SELECT RunId FROM @ArchivedScratch;

                                           SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @ArchivedScratch;

                                           SELECT RunId
                                           FROM dbo.Runs
                                           WHERE RunId IN @RunIds AND ArchivedUtc IS NOT NULL;

                                           EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived;
                                           """;

    public const string CountActiveRunsForArchitectureRequest = """
                                                                SELECT COUNT(1)
                                                                FROM dbo.Runs
                                                                WHERE TenantId = @TenantId
                                                                  AND WorkspaceId = @WorkspaceId
                                                                  AND ScopeProjectId = @ScopeProjectId
                                                                  AND ArchitectureRequestId = @ArchitectureRequestId
                                                                  AND ArchivedUtc IS NULL
                                                                  AND (
                                                                      LegacyRunStatus IS NULL
                                                                      OR LegacyRunStatus NOT IN (@CommittedStatus, @FailedStatus, @QualityRejectedStatus));
                                                                """;

    public const string ExistsRunForArchitectureRequestInScope = """
                                                                 SELECT CASE
                                                                     WHEN EXISTS (
                                                                         SELECT 1
                                                                         FROM dbo.Runs
                                                                         WHERE TenantId = @TenantId
                                                                           AND WorkspaceId = @WorkspaceId
                                                                           AND ScopeProjectId = @ScopeProjectId
                                                                           AND ArchitectureRequestId = @ArchitectureRequestId
                                                                     ) THEN 1
                                                                     ELSE 0
                                                                 END;
                                                                 """;

    public const string ExistsActiveRunWithSystemNameInWorkspace = """
                                                                   SELECT CASE
                                                                       WHEN EXISTS (
                                                                           SELECT 1
                                                                           FROM dbo.Runs
                                                                           WHERE TenantId = @TenantId
                                                                             AND WorkspaceId = @WorkspaceId
                                                                             AND ArchivedUtc IS NULL
                                                                             AND UPPER(LTRIM(RTRIM(ProjectId))) = @NormalizedSystemName
                                                                             AND (@ExcludeRunId IS NULL OR RunId <> @ExcludeRunId)
                                                                       ) THEN 1
                                                                       ELSE 0
                                                                   END;
                                                                   """;

    public const string SelectAnchorGuardByScopedId = $"""
                                                       SELECT
                                                           {RunDetailReadSql.SelectAnchorGuardColumns}
                                                       FROM dbo.Runs
                                                       WHERE RunId = @RunId
                                                         AND TenantId = @TenantId
                                                         AND WorkspaceId = @WorkspaceId
                                                         AND ScopeProjectId = @ScopeProjectId;
                                                       """;

    public const string UpdateOperatorGovernanceDisposition = """
                                                              UPDATE dbo.Runs
                                                              SET OperatorGovernanceDecision = @Decision,
                                                                  OperatorGovernanceDecisionRationale = @Rationale,
                                                                  OperatorGovernanceDecisionUtc = @OccurredUtc,
                                                                  OperatorGovernanceDecisionByUserId = @ActorUserId
                                                              WHERE RunId = @RunId
                                                                AND TenantId = @TenantId
                                                                AND WorkspaceId = @WorkspaceId
                                                                AND ScopeProjectId = @ScopeProjectId
                                                                AND ArchivedUtc IS NULL;
                                                              """;
}
