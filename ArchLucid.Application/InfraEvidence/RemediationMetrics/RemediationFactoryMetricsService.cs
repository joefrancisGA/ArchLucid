using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationMetrics;

public sealed class RemediationFactoryMetrics
{
    public int OpenFindings
    {
        get;
        init;
    }

    public decimal RiskWeightedOpen
    {
        get;
        init;
    }

    public int CriticalExposureCount
    {
        get;
        init;
    }

    public int CreatedThisWeek
    {
        get;
        init;
    }

    public int RemediatedThisWeek
    {
        get;
        init;
    }

    public int NetBurn
    {
        get;
        init;
    }

    public int RecurrenceCount
    {
        get;
        init;
    }

    public decimal PatternCoverageExactMatchPercent
    {
        get;
        init;
    }

    public decimal AutomationPercent
    {
        get;
        init;
    }

    public int VerificationFailureCount
    {
        get;
        init;
    }

    public int ExceptionsActive
    {
        get;
        init;
    }

    public int ExceptionsExpiringSoon
    {
        get;
        init;
    }

    public int ExceptionsExpired
    {
        get;
        init;
    }

    public int BusinessBlockedCount
    {
        get;
        init;
    }

    public double AverageAgeDays
    {
        get;
        init;
    }

    public IReadOnlyList<RemediationMetricCount> TopControlIds
    {
        get;
        init;
    } = [];

    public IReadOnlyList<RemediationMetricCount> TopPatternKeys
    {
        get;
        init;
    } = [];
}

public sealed class RemediationMetricCount
{
    public string Key
    {
        get;
        init;
    } = string.Empty;

    public int Count
    {
        get;
        init;
    }
}

public interface IRemediationFactoryMetricsService
{
    Task<RemediationFactoryMetrics> GetMetricsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}

public sealed class RemediationFactoryMetricsService(
    IProjectScopedOperationalSecurityFindingRepository findingRepository,
    IOperationalSecurityExceptionRepository exceptionRepository,
    IRemediationPatternMatchRepository matchRepository,
    IProjectScopedRemediationInstanceRepository instanceRepository,
    IRemediationPrioritizationRepository prioritizationRepository) : IRemediationFactoryMetricsService
{
    private static readonly TimeSpan ExpiringSoonWindow = TimeSpan.FromDays(14);

    public async Task<RemediationFactoryMetrics> GetMetricsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        DateTime weekStart = utcNow.AddDays(-7);
        ProjectScopeKey projectScope = scope.ToProjectScopeKey();

        RemediationFactoryFindingMetricsAggregate findingMetrics =
            await findingRepository.GetFactoryFindingMetricsAggregateInScopeAsync(
                projectScope,
                weekStart,
                utcNow,
                cancellationToken);

        RemediationFactoryInstanceMetricsAggregate instanceMetrics =
            await instanceRepository.GetFactoryInstanceMetricsAggregateInScopeAsync(
                projectScope,
                weekStart,
                cancellationToken);

        RemediationFactoryExceptionMetricsAggregate exceptionMetrics =
            await exceptionRepository.GetFactoryExceptionMetricsAggregateInScopeAsync(
                projectScope,
                utcNow,
                ExpiringSoonWindow,
                cancellationToken);

        decimal riskWeightedOpen =
            await prioritizationRepository.SumTotalScoresForOpenFindingsInScopeAsync(projectScope, cancellationToken);

        IReadOnlyDictionary<Guid, RemediationPatternMatchResultRecord> activeMatchesByFindingId =
            await matchRepository.ListActiveMatchesByOpenFindingInScopeAsync(projectScope, cancellationToken);

        int matchedFindings = activeMatchesByFindingId.Count;
        int exactMatchCount = activeMatchesByFindingId.Values.Count(match =>
            match.MatchKind == RemediationPatternMatchKind.ExactMatch);

        decimal patternCoverage = matchedFindings == 0
            ? 0m
            : Math.Round((decimal)exactMatchCount / matchedFindings * 100m, 2);

        decimal automationPercent = instanceMetrics.TotalInstances == 0
            ? 0m
            : Math.Round((decimal)instanceMetrics.AutomatedCount / instanceMetrics.TotalInstances * 100m, 2);

        int netBurn = findingMetrics.CreatedThisWeek - instanceMetrics.RemediatedThisWeek;

        return new RemediationFactoryMetrics
        {
            OpenFindings = findingMetrics.OpenFindings,
            RiskWeightedOpen = Math.Round(riskWeightedOpen, 4),
            CriticalExposureCount = findingMetrics.CriticalExposureCount,
            CreatedThisWeek = findingMetrics.CreatedThisWeek,
            RemediatedThisWeek = instanceMetrics.RemediatedThisWeek,
            NetBurn = netBurn,
            RecurrenceCount = findingMetrics.RecurrenceCount,
            PatternCoverageExactMatchPercent = patternCoverage,
            AutomationPercent = automationPercent,
            VerificationFailureCount = instanceMetrics.VerificationFailureCount,
            ExceptionsActive = exceptionMetrics.ExceptionsActive,
            ExceptionsExpiringSoon = exceptionMetrics.ExceptionsExpiringSoon,
            ExceptionsExpired = exceptionMetrics.ExceptionsExpired,
            BusinessBlockedCount = instanceMetrics.BusinessBlockedCount,
            AverageAgeDays = Math.Round(findingMetrics.AverageAgeDays, 2),
            TopControlIds = findingMetrics.TopControlIds
                .Select(item => new RemediationMetricCount { Key = item.Key, Count = item.Count })
                .ToList(),
            TopPatternKeys = instanceMetrics.TopPatternKeys
                .Select(item => new RemediationMetricCount { Key = item.Key, Count = item.Count })
                .ToList(),
        };
    }
}
