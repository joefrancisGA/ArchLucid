using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Pilots;

public sealed partial class DapperPilotReportCardMetricsReader
{
    private static readonly string CommittedRunsScopeFilterRuns =
        """
        r.TenantId = @TenantId
            AND r.WorkspaceId = @WorkspaceId
            AND r.ScopeProjectId = @ScopeProjectId
            AND r.ArchivedUtc IS NULL
            AND (
                (NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL)
                OR (r.GoldenManifestId IS NOT NULL)
            )
        """
        + " AND " + DemoRunSqlPredicates.ExcludeShowcaseDemoRuns("r");

    private static readonly string CommittedRunsScopeFilterRunsInner =
        """
        rInner.TenantId = @TenantId
            AND rInner.WorkspaceId = @WorkspaceId
            AND rInner.ScopeProjectId = @ScopeProjectId
            AND rInner.ArchivedUtc IS NULL
            AND (
                (NULLIF(LTRIM(RTRIM(rInner.CurrentManifestVersion)), N'') IS NOT NULL)
                OR (rInner.GoldenManifestId IS NOT NULL)
            )
        """
        + " AND " + DemoRunSqlPredicates.ExcludeShowcaseDemoRuns("rInner");
}
