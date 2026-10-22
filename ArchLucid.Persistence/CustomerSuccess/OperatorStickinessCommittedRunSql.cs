namespace ArchLucid.Persistence.CustomerSuccess;

/// <summary>Shared committed-run predicate for operator stickiness SQL readers.</summary>
internal static class OperatorStickinessCommittedRunSql
{
    /// <summary>
    ///     Matches <see cref="ArchLucid.Application.Pilots.PilotScorecardBuilder" /> /
    ///     <see cref="ArchLucid.Application.Pilots.PilotValueReportService" /> — manifest reference alone does not mean committed.
    /// </summary>
    internal const string CommittedRunsWhereClause = "r.LegacyRunStatus = @CommittedStatus";

    /// <summary>Funnel <c>FirstManifestUtc</c> subquery — same committed-run predicate as <see cref="CommittedRunsWhereClause" />.</summary>
    internal const string FirstManifestUtcRunFilter = CommittedRunsWhereClause;
}
