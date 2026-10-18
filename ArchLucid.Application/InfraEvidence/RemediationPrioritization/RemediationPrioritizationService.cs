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
    IProjectScopedOperationalSecurityFindingRepository findingRepository,
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

        ProjectScopeKey projectScope = scope.ToProjectScopeKey();
        IReadOnlyList<OperationalSecurityFindingRecord> findings = await findingRepository.ListByScopeAsync(
            projectScope,
            OperationalSecurityFindingStatus.Open,
            cancellationToken);

        if (findings.Count == 0)
            return [];

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights = await GetWeightsAsync(scope, cancellationToken);
        IReadOnlyList<OperationalSecurityExceptionRecord> scopedExceptions =
            await exceptionRepository.ListByScopeAsync(projectScope, cancellationToken);
        IReadOnlyDictionary<Guid, RemediationPatternMatchResultRecord> activeMatchesByFindingId =
            await matchRepository.ListActiveMatchesByOpenFindingInScopeAsync(projectScope, cancellationToken);

        IReadOnlyList<Guid> findingIds = findings.Select(item => item.FindingId).ToList();
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadataRows =
            await findingRepository.ListMetadataByFindingIdsInScopeAsync(projectScope, findingIds, cancellationToken);

        ILookup<Guid, OperationalSecurityFindingMetadataRecord> metadataByFindingId =
            metadataRows.ToLookup(item => item.FindingId);

        List<RemediationPatternVersionKey> versionKeys = activeMatchesByFindingId.Values
            .Select(match => new RemediationPatternVersionKey(match.PatternId, match.PatternVersion))
            .Distinct()
            .ToList();

        IReadOnlyList<RemediationPatternVersionRecord> versionRecords =
            await patternRepository.TryGetVersionsAsync(scope.TenantId, versionKeys, cancellationToken);

        Dictionary<RemediationPatternVersionKey, RemediationPatternVersionRecord> versionsByKey =
            versionRecords.ToDictionary(item => new RemediationPatternVersionKey(item.PatternId, item.Version));

        List<RemediationPrioritizationScoreMutation> scoreMutations = [];
        List<RemediationPrioritizedFinding> ranked = [];

        foreach (OperationalSecurityFindingRecord finding in findings)
        {
            activeMatchesByFindingId.TryGetValue(finding.FindingId, out RemediationPatternMatchResultRecord? match);

            RemediationRiskScoreResult score = ComputeScore(
                finding,
                metadataByFindingId[finding.FindingId].ToList(),
                utcNow,
                weights,
                scopedExceptions,
                match,
                versionsByKey);

            scoreMutations.Add(new RemediationPrioritizationScoreMutation
            {
                FindingId = finding.FindingId,
                TotalScore = score.TotalScore,
                BreakdownJson = score.BreakdownJson,
                ExplanationSummary = score.ExplanationSummary,
                RuleVersion = RemediationPrioritizationConstants.RuleVersion,
                ComputedUtc = utcNow,
            });

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

        await prioritizationRepository.UpsertScoresInScopeAsync(projectScope, scoreMutations, cancellationToken);

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
            await findingRepository.TryGetByIdInScopeAsync(scope.ToProjectScopeKey(), findingId, cancellationToken);

        if (finding is null)
            return null;

        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights = await GetWeightsAsync(scope, cancellationToken);
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        RemediationRiskScoreResult score = await ComputeScoreAsync(
            scope.ToProjectScopeKey(),
            finding,
            utcNow,
            weights,
            runContext: null,
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
        ProjectScopeKey scope,
        OperationalSecurityFindingRecord finding,
        DateTime asOfUtc,
        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights,
        RemediationPrioritizationRunContext? runContext,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata =
            await findingRepository.ListMetadataByFindingInScopeAsync(scope, finding.FindingId, cancellationToken);

        bool hasActiveException = await exceptionRepository.HasActiveExceptionForFindingInScopeAsync(
            scope,
            finding.FindingId,
            asOfUtc,
            cancellationToken);

        string? compensatingControls = null;
        RemediationAutomationLevel? automationLevel = null;
        bool patternHasRollback = false;

        RemediationPatternMatchResultRecord? match = runContext is null
            ? await matchRepository.TryGetActiveMatchInScopeAsync(scope, finding.FindingId, cancellationToken)
            : runContext.ActiveMatchesByFindingId.GetValueOrDefault(finding.FindingId);

        if (match is not null)
        {
            RemediationPatternVersionRecord? version = await patternRepository.TryGetVersionAsync(
                scope.TenantId,
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
            IReadOnlyList<OperationalSecurityExceptionRecord> exceptions = runContext is null
                ? await exceptionRepository.ListByScopeAsync(scope, cancellationToken)
                : runContext.ScopedExceptions;

            compensatingControls = exceptions
                .FirstOrDefault(item =>
                    item.FindingId == finding.FindingId
                    && item.Status == OperationalSecurityExceptionStatus.Active
                    && item.ExpirationUtc > asOfUtc)
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

    private static RemediationRiskScoreResult ComputeScore(
        OperationalSecurityFindingRecord finding,
        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
        DateTime asOfUtc,
        IReadOnlyDictionary<RemediationRiskFactor, decimal> weights,
        IReadOnlyList<OperationalSecurityExceptionRecord> scopedExceptions,
        RemediationPatternMatchResultRecord? match,
        IReadOnlyDictionary<RemediationPatternVersionKey, RemediationPatternVersionRecord> versionsByKey)
    {
        bool hasActiveException = scopedExceptions.Any(item =>
            item.FindingId == finding.FindingId
            && item.Status == OperationalSecurityExceptionStatus.Active
            && item.ExpirationUtc > asOfUtc);

        string? compensatingControls = null;
        RemediationAutomationLevel? automationLevel = null;
        bool patternHasRollback = false;

        if (hasActiveException)
        {
            compensatingControls = scopedExceptions
                .FirstOrDefault(item =>
                    item.FindingId == finding.FindingId
                    && item.Status == OperationalSecurityExceptionStatus.Active
                    && item.ExpirationUtc > asOfUtc)
                ?.CompensatingControls;
        }

        if (match is not null
            && versionsByKey.TryGetValue(
                new RemediationPatternVersionKey(match.PatternId, match.PatternVersion),
                out RemediationPatternVersionRecord? version))
        {
            automationLevel = version.AutomationLevel;

            if (RemediationInstanceGuard.TryParsePatternContent(version, out RemediationPatternVersionContent? content, out _))
                patternHasRollback = content?.Rollback is not null;
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

    private sealed class RemediationPrioritizationRunContext
    {
        public required IReadOnlyList<OperationalSecurityExceptionRecord> ScopedExceptions
        {
            get;
            init;
        }

        public required IReadOnlyDictionary<Guid, RemediationPatternMatchResultRecord> ActiveMatchesByFindingId
        {
            get;
            init;
        }
    }
}
