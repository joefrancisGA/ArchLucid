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
    IOperationalSecurityFindingRepository findingRepository,
    IOperationalSecurityExceptionRepository exceptionRepository,
    IRemediationPatternMatchRepository matchRepository,
    IRemediationInstanceRepository instanceRepository,
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

        IReadOnlyList<OperationalSecurityFindingRecord> allFindings =
            await findingRepository.ListByTenantAsync(scope.TenantId, status: null, cancellationToken);

        IReadOnlyList<OperationalSecurityFindingRecord> openFindings = allFindings
            .Where(item => item.Status is OperationalSecurityFindingStatus.Open or OperationalSecurityFindingStatus.Recurred)
            .ToList();

        IReadOnlyList<RemediationPrioritizationScoreRecord> scores =
            await prioritizationRepository.ListScoresByTenantAsync(scope.TenantId, cancellationToken);

        Dictionary<Guid, decimal> scoreByFinding = scores.ToDictionary(item => item.FindingId, item => item.TotalScore);

        decimal riskWeightedOpen = openFindings.Sum(item =>
            scoreByFinding.TryGetValue(item.FindingId, out decimal score) ? score : 0m);

        int criticalExposure = openFindings.Count(item =>
            string.Equals(item.Severity, "critical", StringComparison.OrdinalIgnoreCase)
            || string.Equals(item.Exposure, "high", StringComparison.OrdinalIgnoreCase)
            || string.Equals(item.Exposure, "critical", StringComparison.OrdinalIgnoreCase));

        int createdThisWeek = allFindings.Count(item => item.CreatedUtc >= weekStart);
        int recurrenceCount = allFindings.Count(item => item.Status == OperationalSecurityFindingStatus.Recurred);

        IReadOnlyList<RemediationInstanceRecord> instances =
            await instanceRepository.ListByTenantAsync(scope.TenantId, cancellationToken);

        int remediatedThisWeek = instances.Count(item =>
            item.VerifiedUtc.HasValue
            && item.VerifiedUtc.Value >= weekStart
            && item.Status is RemediationInstanceStatus.Verified or RemediationInstanceStatus.Closed);

        int netBurn = createdThisWeek - remediatedThisWeek;

        int exactMatchCount = 0;
        int matchedFindings = 0;

        foreach (OperationalSecurityFindingRecord finding in openFindings)
        {
            RemediationPatternMatchResultRecord? match =
                await matchRepository.TryGetActiveMatchAsync(scope.TenantId, finding.FindingId, cancellationToken);

            if (match is null)
                continue;

            matchedFindings++;

            if (match.MatchKind == RemediationPatternMatchKind.ExactMatch)
                exactMatchCount++;
        }

        decimal patternCoverage = matchedFindings == 0
            ? 0m
            : Math.Round((decimal)exactMatchCount / matchedFindings * 100m, 2);

        int automatedCount = instances.Count(item =>
            item.AutomationLevel is RemediationAutomationLevel.SemiAutomated or RemediationAutomationLevel.Automated);

        decimal automationPercent = instances.Count == 0
            ? 0m
            : Math.Round((decimal)automatedCount / instances.Count * 100m, 2);

        int verificationFailures = instances.Count(item => item.Status == RemediationInstanceStatus.VerificationFailed);
        int businessBlocked = instances.Count(item => item.Status == RemediationInstanceStatus.PreflightBlocked);

        IReadOnlyList<OperationalSecurityExceptionRecord> exceptions =
            await exceptionRepository.ListByTenantAsync(scope.TenantId, cancellationToken);

        int exceptionsActive = exceptions.Count(item => item.Status == OperationalSecurityExceptionStatus.Active);
        int exceptionsExpired = exceptions.Count(item => item.Status == OperationalSecurityExceptionStatus.Expired);

        int exceptionsExpiringSoon = exceptions.Count(item =>
            item.Status == OperationalSecurityExceptionStatus.Active
            && item.ExpirationUtc <= utcNow.Add(ExpiringSoonWindow)
            && item.ExpirationUtc > utcNow);

        double averageAgeDays = openFindings.Count == 0
            ? 0
            : openFindings.Average(item => (utcNow - item.FirstObservedUtc).TotalDays);

        List<RemediationMetricCount> topControlIds = openFindings
            .Where(item => !string.IsNullOrWhiteSpace(item.ControlId))
            .GroupBy(item => item.ControlId!, StringComparer.OrdinalIgnoreCase)
            .Select(group => new RemediationMetricCount { Key = group.Key, Count = group.Count() })
            .OrderByDescending(item => item.Count)
            .Take(5)
            .ToList();

        List<RemediationMetricCount> topPatternKeys = instances
            .Where(item => !string.IsNullOrWhiteSpace(item.PatternKey))
            .GroupBy(item => item.PatternKey, StringComparer.OrdinalIgnoreCase)
            .Select(group => new RemediationMetricCount { Key = group.Key, Count = group.Count() })
            .OrderByDescending(item => item.Count)
            .Take(5)
            .ToList();

        return new RemediationFactoryMetrics
        {
            OpenFindings = openFindings.Count,
            RiskWeightedOpen = Math.Round(riskWeightedOpen, 4),
            CriticalExposureCount = criticalExposure,
            CreatedThisWeek = createdThisWeek,
            RemediatedThisWeek = remediatedThisWeek,
            NetBurn = netBurn,
            RecurrenceCount = recurrenceCount,
            PatternCoverageExactMatchPercent = patternCoverage,
            AutomationPercent = automationPercent,
            VerificationFailureCount = verificationFailures,
            ExceptionsActive = exceptionsActive,
            ExceptionsExpiringSoon = exceptionsExpiringSoon,
            ExceptionsExpired = exceptionsExpired,
            BusinessBlockedCount = businessBlocked,
            AverageAgeDays = Math.Round(averageAgeDays, 2),
            TopControlIds = topControlIds,
            TopPatternKeys = topPatternKeys,
        };
    }
}
