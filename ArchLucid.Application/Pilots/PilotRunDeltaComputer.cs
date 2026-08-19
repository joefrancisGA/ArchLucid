using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Roi;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Pilots;

/// <inheritdoc cref = "IPilotRunDeltaComputer"/>
/// <remarks>
///     Read-only by construction: makes one filtered audit query, one trace count (or full-trace list when PilotStrict
///     needs <c>ParsedResultJson</c>), one artifact-descriptor list (when a golden manifest id exists), and at most one
///     evidence-chain query per call. Failures in the audit / trace / artifact / evidence queries are swallowed
///     (warning-logged) so a sponsor report still renders for runs whose ancillary stores are temporarily unavailable.
/// </remarks>
public sealed class PilotRunDeltaComputer(
    IFindingEvidenceChainService evidenceChainService,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IAuditRepository auditRepository,
    IArtifactQueryService artifactQueryService,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IScopeContextProvider scopeContextProvider,
    IRunExplanationSummaryService runExplanationSummaryService,
    IRunAgentOutputPilotEvidenceAggregator pilotEvidenceAggregator,
    IAgentOutputQualityGateOptionsResolver gateOptionsResolver,
    ILogger<PilotRunDeltaComputer> logger) : IPilotRunDeltaComputer
{
    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IArtifactQueryService _artifactQueryService = artifactQueryService ?? throw new ArgumentNullException(nameof(artifactQueryService));
    private readonly IAuditRepository _auditRepository = auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));
    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));
    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));
    private readonly IFindingEvidenceChainService _evidenceChainService = evidenceChainService ?? throw new ArgumentNullException(nameof(evidenceChainService));
    private readonly ILogger<PilotRunDeltaComputer> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunExplanationSummaryService _runExplanationSummaryService =
        runExplanationSummaryService ?? throw new ArgumentNullException(nameof(runExplanationSummaryService));

    private readonly IRunAgentOutputPilotEvidenceAggregator _pilotEvidenceAggregator =
        pilotEvidenceAggregator ?? throw new ArgumentNullException(nameof(pilotEvidenceAggregator));

    private readonly IAgentOutputQualityGateOptionsResolver _gateOptionsResolver =
        gateOptionsResolver ?? throw new ArgumentNullException(nameof(gateOptionsResolver));

    /// <inheritdoc/>
    public async Task<PilotRunDeltas> ComputeAsync(ArchitectureRunDetail detail, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArchitectureRun run = detail.Run;
        string runId = run.RunId;
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime? committedUtc = ResolveManifestCommittedUtc(run, detail.Manifest);
        TimeSpan? wall = committedUtc is { } c ? c - run.CreatedUtc : null;
        IReadOnlyList<KeyValuePair<string, int>> findings = AggregateFindingsBySeverity(detail);
        FindingsSnapshot? persistedFindingsSnapshot = null;

        if (SumFindingCounts(findings) == 0 && run.FindingsSnapshotId is { } findingsSnapshotId && findingsSnapshotId != Guid.Empty)
        {
            persistedFindingsSnapshot =
                await TryLoadFindingsSnapshotAsync(scope, findingsSnapshotId, cancellationToken);

            if (persistedFindingsSnapshot?.Findings is { Count: > 0 } snapshotFindings)
                findings = AggregateFindingsBySeverity(snapshotFindings);
        }

        GovernedFindingCoverageMetric governedCoverage = persistedFindingsSnapshot?.Findings is { Count: > 0 } coverageFindings
            ? AggregateGovernedFindingCoverage(coverageFindings)
            : AggregateGovernedFindingCoverage(detail);

        ArchitectureFinding? topAgentFinding = SelectTopSeverityFinding(detail);
        string? topFindingId = topAgentFinding?.FindingId;
        string? topFindingSeverity = topAgentFinding?.Severity.ToString();

        if (topFindingId is null && persistedFindingsSnapshot?.Findings is { Count: > 0 } topCandidates)
        {
            Finding? snapshotTopFinding = SelectTopSeveritySnapshotFinding(topCandidates);

            if (snapshotTopFinding is not null)
            {
                topFindingId = snapshotTopFinding.FindingId;
                topFindingSeverity = snapshotTopFinding.Severity.ToString();
            }
        }
        AgentOutputQualityGateOptions gateOpts = _gateOptionsResolver.Resolve(cancellationToken);
        bool needsFullTraces = gateOpts is { Enabled: true, Mode: AgentOutputQualityGateMode.PilotStrict };
        (IReadOnlyList<AgentExecutionTrace> traces, int llmCallCount, bool tracesResolved) =
            await TryResolveExecutionTracesAsync(runId, needsFullTraces, cancellationToken);
        bool pilotStrictFails = false;

        if (tracesResolved && needsFullTraces)
        {
            RunExplanationSummary? summary = null;

            if (gateOpts.PilotStrictMinFaithfulnessSupportRatio.HasValue && TryParseRunGuid(runId, out Guid runGuid))
            {
                summary = await _runExplanationSummaryService.GetSummaryAsync(scope, runGuid, cancellationToken);
            }

            pilotStrictFails = await _pilotEvidenceAggregator.WouldPilotStrictBlockSponsorEvidenceAsync(
                traces,
                summary,
                cancellationToken).ConfigureAwait(false);
        }

        Task<(int auditCount, bool auditTruncated)> auditTask = TryCountAuditRowsAsync(runId, cancellationToken);
        Task<FindingEvidenceChainResponse?> chainTask = topFindingId is null
            ? Task.FromResult<FindingEvidenceChainResponse?>(null)
            : TryBuildEvidenceChainAsync(runId, topFindingId, cancellationToken);
        Task<(int? artifactCount, bool artifactResolved)> artifactsTask =
            TryCountArtifactsAsync(run.GoldenManifestId, cancellationToken);
        Task<decimal?> savingsTask = TryResolveEstimatedUsdSavingsAsync(run.FindingsSnapshotId, cancellationToken);

        await Task.WhenAll(auditTask, chainTask, artifactsTask, savingsTask);

        (int auditCount, bool auditTruncated) = await auditTask;
        FindingEvidenceChainResponse? chain = await chainTask;
        (int? artifactCount, bool artifactResolved) = await artifactsTask;
        decimal? estimatedUsdSavings = await savingsTask;
        bool isDemo = ContosoRetailDemoIdentifiers.IsDemoRunId(runId) || ContosoRetailDemoIdentifiers.IsDemoRequestId(run.RequestId);
        return new PilotRunDeltas
        {
            RunCreatedUtc = run.CreatedUtc,
            ManifestCommittedUtc = committedUtc,
            TimeToCommittedManifest = wall,
            FindingsBySeverity = findings,
            GovernedFindingCoverage = governedCoverage,
            AuditRowCount = auditCount,
            AuditRowCountTruncated = auditTruncated,
            LlmCallCount = llmCallCount,
            LlmCallCountResolved = tracesResolved,
            AgentOutputPilotStrictSignalsResolved = tracesResolved,
            AgentOutputPilotStrictViolatesSponsorEvidence = pilotStrictFails,
            TopFindingId = topFindingId,
            TopFindingSeverity = topFindingSeverity,
            TopFindingEvidenceChain = chain,
            IsDemoTenant = isDemo,
            EstimatedUsdSavings = estimatedUsdSavings,
            SynthesizedArtifactDescriptorCount = artifactCount,
            SynthesizedArtifactDescriptorCountResolved = artifactResolved,
        };
    }

    private Task<decimal?> TryResolveEstimatedUsdSavingsAsync(Guid? findingsSnapshotId, CancellationToken cancellationToken) =>
        _tenantEstimatedUsdSavingsResolver.ResolveFromFindingsSnapshotIdAsync(findingsSnapshotId, cancellationToken);

    /// <summary>
    ///     Default path counts traces without loading <c>TraceJson</c>. PilotStrict loads full rows for quality evaluation.
    /// </summary>
    private Task<(IReadOnlyList<AgentExecutionTrace> traces, int count, bool resolved)> TryResolveExecutionTracesAsync(
        string runId,
        bool needsFullTraces,
        CancellationToken cancellationToken)
    {
        if (needsFullTraces)
            return TryListExecutionTracesAsync(runId, cancellationToken);

        return TryCountExecutionTracesAsync(runId, cancellationToken);
    }

    private async Task<(IReadOnlyList<AgentExecutionTrace> traces, int count, bool resolved)> TryCountExecutionTracesAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext traceScope = _scopeContextProvider.GetCurrentScope();
            int count = await _agentExecutionTraceRepository.CountByRunIdAsync(traceScope, runId, cancellationToken);

            return ([], count, true);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarningWithSanitizedUserArg(ex,
                "Pilot delta: execution trace count unavailable for run {RunId}; LLM counts not attested.", runId);

            return ([], 0, false);
        }
    }

    private async Task<(IReadOnlyList<AgentExecutionTrace> traces, int count, bool resolved)> TryListExecutionTracesAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext traceScope = _scopeContextProvider.GetCurrentScope();
            IReadOnlyList<AgentExecutionTrace> list =
                await _agentExecutionTraceRepository.GetByRunIdAsync(traceScope, runId, cancellationToken);

            return (list, list.Count, true);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarningWithSanitizedUserArg(ex,
                "Pilot delta: execution traces unavailable for run {RunId}; LLM counts and PilotStrict gates not attested.", runId);

            return ([], 0, false);
        }
    }

    private async Task<(int? Count, bool Resolved)> TryCountArtifactsAsync(Guid? goldenManifestId, CancellationToken cancellationToken)
    {
        if (goldenManifestId is null || goldenManifestId == Guid.Empty)
            return (null, false);
        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            IReadOnlyList<ArtifactDescriptor> list =
                await _artifactQueryService.ListArtifactsByManifestIdAsync(scope, goldenManifestId.Value, cancellationToken);
            return (list.Count, true);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Pilot delta: artifact descriptor count unavailable for manifest {ManifestId}; omitting count.", goldenManifestId);
            return (null, false);
        }
    }

    /// <summary>Returns severity counts in descending order (highest count first), grouped case-insensitively.</summary>
    private static IReadOnlyList<KeyValuePair<string, int>> AggregateFindingsBySeverity(ArchitectureRunDetail detail)
    {
        return detail.Results.Where(_ => true).SelectMany(static r => r.Findings).Where(_ => true)
            .GroupBy(static f => f.Severity.ToString(), StringComparer.OrdinalIgnoreCase).Select(g => new KeyValuePair<string, int>(g.Key, g.Count()))
            .OrderByDescending(static p => p.Value).ThenBy(static p => p.Key, StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static IReadOnlyList<KeyValuePair<string, int>> AggregateFindingsBySeverity(IReadOnlyList<Finding> findings)
    {
        return findings
            .GroupBy(static f => f.Severity.ToString(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new KeyValuePair<string, int>(g.Key, g.Count()))
            .OrderByDescending(static p => p.Value)
            .ThenBy(static p => p.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private async Task<FindingsSnapshot?> TryLoadFindingsSnapshotAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        CancellationToken cancellationToken)
    {
        try
        {
            FindingsSnapshot? snapshot =
                await _findingsSnapshotRepository.GetCoverageProjectionByIdAsync(scope, findingsSnapshotId, cancellationToken);

            if (snapshot?.Findings is null || snapshot.Findings.Count == 0)
                return null;

            return snapshot;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex,
                "Pilot delta: findings snapshot {FindingsSnapshotId} unavailable; reporting zero findings from agent results.",
                findingsSnapshotId);

            return null;
        }
    }

    private static int SumFindingCounts(IReadOnlyList<KeyValuePair<string, int>> findingsBySeverity)
    {
        int total = 0;

        foreach (KeyValuePair<string, int> pair in findingsBySeverity)
            total += pair.Value;

        return total;
    }

    /// <summary>
    ///     Committed wall clock prefers <see cref="ArchitectureRun.CompletedUtc" /> when manifest metadata was stamped at
    ///     run creation but the review finalized later — keeps median time-to-finalized honest on the reviews hub.
    /// </summary>
    private static DateTime? ResolveManifestCommittedUtc(ArchitectureRun run, GoldenManifest? manifest)
    {
        DateTime? manifestUtc = manifest?.Metadata?.CreatedUtc;
        DateTime? completedUtc = run.CompletedUtc;

        if (completedUtc is null)
            return manifestUtc;

        if (manifestUtc is null)
            return completedUtc;

        return completedUtc > manifestUtc ? completedUtc : manifestUtc;
    }

    /// <summary>
    ///     Computes the governed-finding coverage metric from all decision-grade findings across all agent results.
    ///     Advisory-only findings (<see cref="FindingEnforcementTier.Advisory" />) are counted separately
    ///     so consumers can distinguish governance-blocking coverage from optional guidance.
    /// </summary>
    internal static GovernedFindingCoverageMetric AggregateGovernedFindingCoverage(IReadOnlyList<Finding> findings)
    {
        List<Finding> active = findings.Where(static f => !f.IsMuted).ToList();

        if (active.Count == 0)
            return GovernedFindingCoverageMetric.NotAvailable();

        int governed = active.Count(static f => f.EnforcementTier == FindingEnforcementTier.PolicyViolation);
        int advisory = active.Count(static f => f.EnforcementTier == FindingEnforcementTier.Advisory);
        int withPolicyRule = active.Count(static f => !string.IsNullOrWhiteSpace(f.PolicyRuleId));
        int withEvidenceRefs = active.Count(HasPersistedEvidencePointer);

        return GovernedFindingCoverageMetric.Compute(active.Count, governed, advisory, withPolicyRule, withEvidenceRefs);
    }

    internal static GovernedFindingCoverageMetric AggregateGovernedFindingCoverage(ArchitectureRunDetail detail)
    {
        IReadOnlyList<ArchitectureFinding> allFindings = detail.Results
            .SelectMany(static r => r.Findings)
            .ToList();

        int total = allFindings.Count;

        if (total == 0)
            return GovernedFindingCoverageMetric.NotAvailable();

        int governed = allFindings.Count(static f => f.EnforcementTier == FindingEnforcementTier.PolicyViolation);
        int advisory = allFindings.Count(static f => f.EnforcementTier == FindingEnforcementTier.Advisory);
        int withPolicyRule = allFindings.Count(static f => !string.IsNullOrWhiteSpace(f.PolicyRuleId));
        int withEvidenceRefs = allFindings.Count(static f => f.EvidenceRefs.Count > 0);

        return GovernedFindingCoverageMetric.Compute(total, governed, advisory, withPolicyRule, withEvidenceRefs);
    }

    private static bool HasPersistedEvidencePointer(Finding finding)
    {
        return finding.RelatedNodeIds.Count > 0
            || !string.IsNullOrWhiteSpace(finding.AgentExecutionTraceId);
    }

    private static Finding? SelectTopSeveritySnapshotFinding(IReadOnlyList<Finding> findings)
    {
        return findings
            .Where(static f => !f.IsMuted)
            .OrderByDescending(static f => (int)f.Severity)
            .FirstOrDefault();
    }

    /// <summary>Picks the single highest-severity finding; ties broken by first-seen order to keep output deterministic.</summary>
    private static ArchitectureFinding? SelectTopSeverityFinding(ArchitectureRunDetail detail)
    {
        return detail.Results
            .Where(static r => r is not null)
            .SelectMany(static r => r.Findings ?? [])
            .OrderByDescending(static f => (int)f.Severity)
            .FirstOrDefault();
    }

    private async Task<(int Count, bool Truncated)> TryCountAuditRowsAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return (0, false);
        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            AuditEventFilter filter = new()
            {
                RunId = runGuid,
                Take = 1,
            };
            int count = await _auditRepository.CountFilteredAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, filter, cancellationToken);
            return (count, false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarningWithSanitizedUserArg(ex, "Pilot delta: audit row count unavailable for run {RunId}; reporting 0.", runId);
            return (0, false);
        }
    }

    private async Task<FindingEvidenceChainResponse?> TryBuildEvidenceChainAsync(string runId, string findingId, CancellationToken cancellationToken)
    {
        try
        {
            return await _evidenceChainService.BuildAsync(runId, findingId, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Pilot delta: evidence chain unavailable for run {RunId} finding {FindingId}; omitting chain pointers.",
                LogSanitizer.Sanitize(runId),
                LogSanitizer.Sanitize(findingId)); // codeql[cs/log-forging]: operational ids sanitized immediately above (params boxing).
            return null;
        }
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
