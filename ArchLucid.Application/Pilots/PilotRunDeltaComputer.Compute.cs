using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Explanation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Pilots;

public sealed partial class PilotRunDeltaComputer
{
    /// <inheritdoc/>
    public async Task<PilotRunDeltas> ComputeAsync(ArchitectureRunDetail detail, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArchitectureRun run = detail.Run;
        string runId = run.RunId;
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime? committedUtc = ResolveManifestCommittedUtc(run, detail.Manifest);
        TimeSpan? wall = committedUtc is { } c ? c - run.CreatedUtc : null;
        IReadOnlyList<KeyValuePair<string, int>> agentFindings = AggregateFindingsBySeverity(detail);
        IReadOnlyList<KeyValuePair<string, int>> findings = agentFindings;
        FindingsSnapshot? persistedFindingsSnapshot = null;
        bool findingsFromSnapshot = false;

        if (run.FindingsSnapshotId is { } findingsSnapshotId && findingsSnapshotId != Guid.Empty)
        {
            persistedFindingsSnapshot =
                await TryLoadFindingsSnapshotAsync(scope, findingsSnapshotId, cancellationToken);

            if (persistedFindingsSnapshot?.Findings is { Count: > 0 } snapshotFindingsList)
            {
                IReadOnlyList<KeyValuePair<string, int>> snapshotFindings =
                    AggregateFindingsBySeverity(snapshotFindingsList);

                if (SumFindingCounts(agentFindings) == 0
                    || SumFindingCounts(snapshotFindings) > SumFindingCounts(agentFindings))
                {
                    findings = snapshotFindings;
                    findingsFromSnapshot = true;
                }
            }
        }

        GovernedFindingCoverageMetric governedCoverage = findingsFromSnapshot && persistedFindingsSnapshot?.Findings is { Count: > 0 } coverageFindings
            ? AggregateGovernedFindingCoverage(coverageFindings)
            : AggregateGovernedFindingCoverage(detail);

        ArchitectureFinding? topAgentFinding = SelectTopSeverityFinding(detail);
        string? topFindingId = topAgentFinding?.FindingId;
        string? topFindingSeverity = topAgentFinding?.Severity.ToString();

        if (findingsFromSnapshot && persistedFindingsSnapshot?.Findings is { Count: > 0 } snapshotTopCandidates)
        {
            Finding? snapshotTopFinding = SelectTopSeveritySnapshotFinding(snapshotTopCandidates);

            if (snapshotTopFinding is not null)
            {
                topFindingId = snapshotTopFinding.FindingId;
                topFindingSeverity = snapshotTopFinding.Severity.ToString();
            }
        }
        else if (topFindingId is null && persistedFindingsSnapshot?.Findings is { Count: > 0 } topCandidates)
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
        IReadOnlyList<ArchitectureFinding> sponsorNarrativeFindings =
            topAgentFinding is null && persistedFindingsSnapshot?.Findings is { Count: > 0 } narrativeFindings
                ? PilotSponsorMaterialFindingsMapper.MapFromSnapshotFindings(narrativeFindings)
                : [];

        return new PilotRunDeltas
        {
            RunCreatedUtc = run.CreatedUtc,
            ManifestCommittedUtc = committedUtc,
            TimeToCommittedManifest = wall,
            FindingsBySeverity = findings,
            SponsorNarrativeFindings = sponsorNarrativeFindings,
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

    /// <summary>Returns severity counts in descending order (highest count first), grouped case-insensitively.</summary>
    private static IReadOnlyList<KeyValuePair<string, int>> AggregateFindingsBySeverity(ArchitectureRunDetail detail)
    {
        return detail.Results
            .SelectMany(static r => r.Findings)
            .Where(static f => !f.IsMuted)
            .GroupBy(static f => f.Severity.ToString(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new KeyValuePair<string, int>(g.Key, g.Count()))
            .OrderByDescending(static p => p.Value)
            .ThenBy(static p => p.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static IReadOnlyList<KeyValuePair<string, int>> AggregateFindingsBySeverity(IReadOnlyList<Finding> findings)
    {
        return findings
            .Where(static f => !f.IsMuted)
            .GroupBy(static f => f.Severity.ToString(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new KeyValuePair<string, int>(g.Key, g.Count()))
            .OrderByDescending(static p => p.Value)
            .ThenBy(static p => p.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();
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
            .Where(static f => !f.IsMuted)
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
            .Where(static f => !f.IsMuted)
            .OrderByDescending(static f => (int)f.Severity)
            .FirstOrDefault();
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
