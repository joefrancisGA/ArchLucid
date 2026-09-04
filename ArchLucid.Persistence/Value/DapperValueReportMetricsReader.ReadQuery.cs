using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Value;

public sealed partial class DapperValueReportMetricsReader
{
    public async Task<ValueReportRawMetrics> ReadAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTimeOffset fromUtcInclusive,
        DateTimeOffset toUtcExclusive,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        object parameters = new
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            FromUtc = fromUtcInclusive.UtcDateTime,
            ToUtc = toUtcExclusive.UtcDateTime,
            GovTypes = ValueReportMetricEventTypes.GovernanceEventTypes,
            DriftTypes = ValueReportMetricEventTypes.DriftAlertEventTypes,
            CanonicalShowcaseRunBaselineId = DemoRunSqlPredicates.CanonicalShowcaseRunBaselineId,
            CanonicalShowcaseRunHardenedId = DemoRunSqlPredicates.CanonicalShowcaseRunHardenedId,
        };

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(BatchSql, parameters, cancellationToken: cancellationToken));

        List<ValueReportRunStatusCount> statusCounts = (await multi.ReadAsync<RunStatusSqlRow>())
            .Select(static r =>
                new ValueReportRunStatusCount(r.LegacyRunStatusLabel, (int)Math.Min(int.MaxValue, r.Cnt)))
            .ToList();

        long runsCompleted = await multi.ReadSingleAsync<long>();
        long manifests = await multi.ReadSingleAsync<long>();
        long governance = await multi.ReadSingleAsync<long>();
        long drift = await multi.ReadSingleAsync<long>();
        FindingFeedbackAggRow feedbackAgg = await multi.ReadSingleAsync<FindingFeedbackAggRow>();
        TenantBaselineRow? tenantBaseline = await multi.ReadSingleOrDefaultAsync<TenantBaselineRow>();
        ReviewCycleMeasureRow measure = await multi.ReadSingleAsync<ReviewCycleMeasureRow>();

        decimal? measuredAvg = measure.Cnt == 0 ? null : measure.AvgHours;
        int sampleSize = measure.Cnt > int.MaxValue ? int.MaxValue : (int)measure.Cnt;

        return new ValueReportRawMetrics(
            statusCounts,
            (int)Math.Min(int.MaxValue, runsCompleted),
            (int)Math.Min(int.MaxValue, manifests),
            (int)Math.Min(int.MaxValue, governance),
            (int)Math.Min(int.MaxValue, drift),
            (int)Math.Clamp(feedbackAgg.NetScore, int.MinValue, int.MaxValue),
            (int)Math.Min(int.MaxValue, feedbackAgg.VoteCount),
            tenantBaseline?.BaselineReviewCycleHours,
            tenantBaseline?.BaselineReviewCycleSource,
            tenantBaseline?.BaselineReviewCycleCapturedUtc,
            measuredAvg,
            sampleSize,
            tenantBaseline?.BaselineManualPrepHoursPerReview,
            tenantBaseline?.BaselinePeoplePerReview,
            tenantBaseline?.ArchitectureTeamSize);
    }
}
