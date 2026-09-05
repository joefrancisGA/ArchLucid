using System.Text.Json;

using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationPrioritization;

public sealed class RemediationPrioritizedFinding
{
    public Guid FindingId
    {
        get;
        init;
    }

    public decimal TotalScore
    {
        get;
        init;
    }

    public string ExplanationSummary
    {
        get;
        init;
    } = string.Empty;

    public string BreakdownJson
    {
        get;
        init;
    } = string.Empty;

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? ControlId
    {
        get;
        init;
    }

    public string? PatternKey
    {
        get;
        init;
    }
}

public sealed class RemediationPrioritizationExplanation
{
    public Guid FindingId
    {
        get;
        init;
    }

    public decimal TotalScore
    {
        get;
        init;
    }

    public string ExplanationSummary
    {
        get;
        init;
    } = string.Empty;

    public string BreakdownJson
    {
        get;
        init;
    } = string.Empty;

    public string RuleVersion
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyDictionary<RemediationRiskFactor, decimal> Weights
    {
        get;
        init;
    } = new Dictionary<RemediationRiskFactor, decimal>();
}

public interface IRemediationPrioritizationService
{
    Task<IReadOnlyList<RemediationPrioritizedFinding>> RankOpenFindingsAsync(
        ScopeContext scope,
        string actorKey,
        CancellationToken cancellationToken = default);

    Task<RemediationPrioritizationExplanation?> GetExplanationAsync(
        ScopeContext scope,
        Guid findingId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<RemediationRiskFactor, decimal>> GetWeightsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task UpdateWeightsAsync(
        ScopeContext scope,
        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights,
        string actorKey,
        CancellationToken cancellationToken = default);
}

public sealed class RemediationPrioritizationService(
    IOperationalSecurityFindingRepository findingRepository,
    IOperationalSecurityExceptionRepository exceptionRepository,
    IRemediationPatternMatchRepository matchRepository,
    IRemediationPatternRepository patternRepository,
    IRemediationPrioritizationRepository prioritizationRepository) : IRemediationPrioritizationService
{
    public async Task<IReadOnlyList<RemediationPrioritizedFinding>> RankOpenFindingsAsync(
        ScopeContext scope,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<OperationalSecurityFindingRecord> findings = await findingRepository.ListByTenantAsync(
            scope.TenantId,
            OperationalSecurityFindingStatus.Open,
            cancellationToken);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        List<RemediationPrioritizedFinding> ranked = [];
        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights = await GetWeightsAsync(scope, cancellationToken);

        foreach (OperationalSecurityFindingRecord finding in findings)
        {
            RemediationRiskScoreResult score = await ComputeScoreAsync(
                scope.TenantId,
                finding,
                utcNow,
                weights,
                cancellationToken);

            await prioritizationRepository.UpsertScoreAsync(
                new RemediationPrioritizationScoreRecord
                {
                    FindingId = finding.FindingId,
                    TenantId = scope.TenantId,
                    TotalScore = score.TotalScore,
                    BreakdownJson = score.BreakdownJson,
                    ExplanationSummary = score.ExplanationSummary,
                    RuleVersion = RemediationPrioritizationConstants.RuleVersion,
                    ComputedUtc = utcNow,
                },
                cancellationToken);

            RemediationPatternMatchResultRecord? match =
                await matchRepository.TryGetActiveMatchAsync(scope.TenantId, finding.FindingId, cancellationToken);

            ranked.Add(new RemediationPrioritizedFinding
            {
                FindingId = finding.FindingId,
                TotalScore = score.TotalScore,
                ExplanationSummary = score.ExplanationSummary,
                BreakdownJson = score.BreakdownJson,
                CloudResourceId = finding.CloudResourceId,
                ControlId = finding.ControlId,
                PatternKey = match?.PatternKey,
            });
        }

        return ranked
            .OrderByDescending(item => item.TotalScore)
            .ThenBy(item => item.FindingId)
            .ToList();
    }

    public async Task<RemediationPrioritizationExplanation?> GetExplanationAsync(
        ScopeContext scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        OperationalSecurityFindingRecord? finding =
            await findingRepository.TryGetByIdAsync(scope.TenantId, findingId, cancellationToken);

        if (finding is null)
            return null;

        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights = await GetWeightsAsync(scope, cancellationToken);
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        RemediationRiskScoreResult score = await ComputeScoreAsync(
            scope.TenantId,
            finding,
            utcNow,
            weights,
            cancellationToken);

        return new RemediationPrioritizationExplanation
        {
            FindingId = findingId,
            TotalScore = score.TotalScore,
            ExplanationSummary = score.ExplanationSummary,
            BreakdownJson = score.BreakdownJson,
            RuleVersion = RemediationPrioritizationConstants.RuleVersion,
            Weights = weights,
        };
    }

    public async Task<IReadOnlyDictionary<RemediationRiskFactor, decimal>> GetWeightsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RemediationPrioritizationWeightsRecord? stored =
            await prioritizationRepository.TryGetWeightsAsync(scope.TenantId, cancellationToken);

        if (stored is null || string.IsNullOrWhiteSpace(stored.WeightsJson))
            return RemediationRiskScoreEvaluator.DefaultWeights();

        Dictionary<string, decimal>? parsed = JsonSerializer.Deserialize<Dictionary<string, decimal>>(stored.WeightsJson);

        if (parsed is null || parsed.Count == 0)
            return RemediationRiskScoreEvaluator.DefaultWeights();

        Dictionary<RemediationRiskFactor, decimal> weights = RemediationRiskScoreEvaluator.DefaultWeights()
            .ToDictionary(item => item.Key, item => item.Value);

        foreach (KeyValuePair<string, decimal> entry in parsed)
        {
            if (Enum.TryParse(entry.Key, ignoreCase: true, out RemediationRiskFactor factor))
                weights[factor] = entry.Value;
        }

        return weights;
    }

    public async Task UpdateWeightsAsync(
        ScopeContext scope,
        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(weights);

        if (string.IsNullOrWhiteSpace(actorKey))
            throw new ArgumentException("ActorKey is required.", nameof(actorKey));

        Dictionary<string, decimal> payload = weights.ToDictionary(
            item => item.Key.ToString(),
            item => item.Value);

        await prioritizationRepository.UpsertWeightsAsync(
            new RemediationPrioritizationWeightsRecord
            {
                TenantId = scope.TenantId,
                WeightsJson = JsonSerializer.Serialize(payload),
                UpdatedByActorKey = actorKey.Trim(),
                UpdatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            cancellationToken);
    }

    private async Task<RemediationRiskScoreResult> ComputeScoreAsync(
        Guid tenantId,
        OperationalSecurityFindingRecord finding,
        DateTime asOfUtc,
        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata =
            await findingRepository.ListMetadataByFindingAsync(tenantId, finding.FindingId, cancellationToken);

        bool hasActiveException = await exceptionRepository.HasActiveExceptionForFindingAsync(
            tenantId,
            finding.FindingId,
            asOfUtc,
            cancellationToken);

        string? compensatingControls = null;
        RemediationAutomationLevel? automationLevel = null;
        bool patternHasRollback = false;

        RemediationPatternMatchResultRecord? match =
            await matchRepository.TryGetActiveMatchAsync(tenantId, finding.FindingId, cancellationToken);

        if (match is not null)
        {
            RemediationPatternVersionRecord? version = await patternRepository.TryGetVersionAsync(
                tenantId,
                match.PatternId,
                match.PatternVersion,
                cancellationToken);

            if (version is not null)
            {
                automationLevel = version.AutomationLevel;

                if (RemediationInstanceGuard.TryParsePatternContent(version, out RemediationPatternVersionContent? content, out _))
                    patternHasRollback = content?.Rollback is not null;
            }
        }

        if (hasActiveException)
        {
            IReadOnlyList<OperationalSecurityExceptionRecord> exceptions =
                await exceptionRepository.ListByTenantAsync(tenantId, cancellationToken);

            compensatingControls = exceptions
                .FirstOrDefault(item => item.FindingId == finding.FindingId && item.Status == OperationalSecurityExceptionStatus.Active)
                ?.CompensatingControls;
        }

        return RemediationRiskScoreEvaluator.Evaluate(
            finding,
            metadata,
            hasActiveException,
            compensatingControls,
            automationLevel,
            patternHasRollback,
            weights);
    }
}
