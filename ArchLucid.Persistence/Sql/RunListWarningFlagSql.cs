namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Warning flags for run list queries — LEFT JOIN aggregates instead of per-row correlated EXISTS (TB-576).
/// </summary>
internal static class RunListWarningFlagSql
{
    /// <summary>Projected columns; pair with <see cref="LeftJoinAggregates" /> after <c>FROM dbo.Runs</c>.</summary>
    public const string SelectColumns = """
                                        ISNULL(fsWarn.HasWarnings, 0) AS HasWarnings,
                                        ISNULL(govWarn.HasGovernanceWarnings, 0) AS HasGovernanceWarnings
                                        """;

    /// <summary>
    ///     Pre-aggregated findings and open-alert presence keyed by <c>RunId</c> for dashboard list paths.
    /// </summary>
    public const string LeftJoinAggregates = """
                                             LEFT JOIN (
                                                 SELECT
                                                     fs.RunId,
                                                     CAST(MAX(CASE WHEN fs.HasWarnings = 1 THEN 1 ELSE 0 END) AS bit) AS HasWarnings
                                                 FROM dbo.FindingsSnapshots fs WITH (NOLOCK)
                                                 WHERE fs.ArchivedUtc IS NULL
                                                 GROUP BY fs.RunId
                                             ) fsWarn ON fsWarn.RunId = dbo.Runs.RunId
                                             LEFT JOIN (
                                                 SELECT
                                                     ar.RunId,
                                                     CAST(1 AS bit) AS HasGovernanceWarnings
                                                 FROM dbo.AlertRecords ar WITH (NOLOCK)
                                                 WHERE ar.Status = N'Open'
                                                 GROUP BY ar.RunId
                                             ) govWarn ON govWarn.RunId = dbo.Runs.RunId
                                             """;
}
