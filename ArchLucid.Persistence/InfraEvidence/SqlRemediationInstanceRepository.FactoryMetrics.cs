using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlRemediationInstanceRepository
{
    public async Task<RemediationFactoryInstanceMetricsAggregate> GetFactoryInstanceMetricsAggregateInScopeAsync(
        ProjectScopeKey scope,
        DateTime weekStartUtc,
        CancellationToken cancellationToken = default)
    {
        const string summarySql = """
                                  SELECT
                                      COUNT(1) AS TotalInstances,
                                      SUM(CASE WHEN VerifiedUtc >= @WeekStartUtc
                                          AND Status IN (@VerifiedStatus, @ClosedStatus) THEN 1 ELSE 0 END) AS RemediatedThisWeek,
                                      SUM(CASE WHEN AutomationLevel IN (@SemiAutomated, @Automated) THEN 1 ELSE 0 END) AS AutomatedCount,
                                      SUM(CASE WHEN Status = @VerificationFailedStatus THEN 1 ELSE 0 END) AS VerificationFailureCount,
                                      SUM(CASE WHEN Status = @PreflightBlockedStatus THEN 1 ELSE 0 END) AS BusinessBlockedCount
                                  FROM dbo.RemediationInstances
                                  WHERE TenantId = @TenantId
                                    AND WorkspaceId = @WorkspaceId
                                    AND ProjectId = @ProjectId;
                                  """;

        const string topPatternsSql = """
                                      SELECT TOP (5) PatternKey AS [Key], COUNT(1) AS Count
                                      FROM dbo.RemediationInstances
                                      WHERE TenantId = @TenantId
                                        AND WorkspaceId = @WorkspaceId
                                        AND ProjectId = @ProjectId
                                        AND PatternKey IS NOT NULL
                                        AND LTRIM(RTRIM(PatternKey)) <> ''
                                      GROUP BY PatternKey
                                      ORDER BY COUNT(1) DESC, PatternKey;
                                      """;

        object parameters = new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            WeekStartUtc = weekStartUtc,
            VerifiedStatus = (int)RemediationInstanceStatus.Verified,
            ClosedStatus = (int)RemediationInstanceStatus.Closed,
            SemiAutomated = (int)RemediationAutomationLevel.SemiAutomated,
            Automated = (int)RemediationAutomationLevel.Automated,
            VerificationFailedStatus = (int)RemediationInstanceStatus.VerificationFailed,
            PreflightBlockedStatus = (int)RemediationInstanceStatus.PreflightBlocked,
        };

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        InstanceMetricsSummaryRow? summary = await conn.QuerySingleOrDefaultAsync<InstanceMetricsSummaryRow>(
            new CommandDefinition(summarySql, parameters, cancellationToken: cancellationToken));

        IEnumerable<RemediationFactoryMetricKeyCount> topPatterns = await conn.QueryAsync<RemediationFactoryMetricKeyCount>(
            new CommandDefinition(topPatternsSql, parameters, cancellationToken: cancellationToken));

        return new RemediationFactoryInstanceMetricsAggregate
        {
            TotalInstances = summary?.TotalInstances ?? 0,
            RemediatedThisWeek = summary?.RemediatedThisWeek ?? 0,
            AutomatedCount = summary?.AutomatedCount ?? 0,
            VerificationFailureCount = summary?.VerificationFailureCount ?? 0,
            BusinessBlockedCount = summary?.BusinessBlockedCount ?? 0,
            TopPatternKeys = topPatterns.ToList(),
        };
    }

    private sealed class InstanceMetricsSummaryRow
    {
        public int TotalInstances
        {
            get;
            init;
        }

        public int RemediatedThisWeek
        {
            get;
            init;
        }

        public int AutomatedCount
        {
            get;
            init;
        }

        public int VerificationFailureCount
        {
            get;
            init;
        }

        public int BusinessBlockedCount
        {
            get;
            init;
        }
    }
}
