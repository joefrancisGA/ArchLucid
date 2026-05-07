using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Explanation;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Pilots;

/// <inheritdoc cref="IPilotRunDeltaComputer"/>
/// <remarks>
///     Read-only by construction: makes one filtered audit query, one trace query, one artifact-descriptor list (when a
///     golden manifest id exists), and at most one evidence-chain query per call. Failures in the audit / trace /
///     artifact / evidence queries are swallowed (warning-logged) so a sponsor report still renders for runs whose
///     ancillary stores are temporarily unavailable.
/// </remarks>
public sealed class PilotRunDeltaComputer(
    IFindingEvidenceChainService evidenceChainService,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IAuditRepository auditRepository,
    IArtifactQueryService artifactQueryService,
    IScopeContextProvider scopeContextProvider,
    IRunExplanationSummaryService runExplanationSummaryService,
    IRunAgentOutputPilotEvidenceAggregator pilotEvidenceAggregator,
    IOptions<AgentOutputQualityGateOptions> gateOptions,
    ILogger<PilotRunDeltaComputer> logger)
    : IPilotRunDeltaComputer
{
    private readonly byte __primaryConstructorArgumentValidation =
        __ValidatePrimaryConstructorArguments(
            evidenceChainService,
            agentExecutionTraceRepository,
            auditRepository,
            artifactQueryService,
            scopeContextProvider,
            runExplanationSummaryService,
            pilotEvidenceAggregator,
            gateOptions,
            logger);

    private static byte __ValidatePrimaryConstructorArguments(
        IFindingEvidenceChainService evidenceChainService,
        IAgentExecutionTraceRepository agentExecutionTraceRepository,
        IAuditRepository auditRepository,
        IArtifactQueryService artifactQueryService,
        IScopeContextProvider scopeContextProvider,
        IRunExplanationSummaryService runExplanationSummaryService,
        IRunAgentOutputPilotEvidenceAggregator pilotEvidenceAggregator,
        IOptions<AgentOutputQualityGateOptions> gateOptions,
        ILogger<PilotRunDeltaComputer> logger)
    {
        ArgumentNullException.ThrowIfNull(evidenceChainService);
        ArgumentNullException.ThrowIfNull(agentExecutionTraceRepository);
        ArgumentNullException.ThrowIfNull(auditRepository);
        ArgumentNullException.ThrowIfNull(artifactQueryService);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);
        ArgumentNullException.ThrowIfNull(runExplanationSummaryService);
        ArgumentNullException.ThrowIfNull(pilotEvidenceAggregator);
        ArgumentNullException.ThrowIfNull(gateOptions);
        ArgumentNullException.ThrowIfNull(logger);
        return (byte)0;
    }

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IArtifactQueryService _artifactQueryService =
        artifactQueryService ?? throw new ArgumentNullException(nameof(artifactQueryService));

    private readonly IAuditRepository _auditRepository =
        auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    private readonly IFindingEvidenceChainService _evidenceChainService =
        evidenceChainService ?? throw new ArgumentNullException(nameof(evidenceChainService));

    private readonly ILogger<PilotRunDeltaComputer> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunExplanationSummaryService _runExplanationSummaryService =
        runExplanationSummaryService ?? throw new ArgumentNullException(nameof(runExplanationSummaryService));

    private readonly IRunAgentOutputPilotEvidenceAggregator _pilotEvidenceAggregator =
        pilotEvidenceAggregator ?? throw new ArgumentNullException(nameof(pilotEvidenceAggregator));

    private readonly IOptions<AgentOutputQualityGateOptions> _gateOptions =
        gateOptions ?? throw new ArgumentNullException(nameof(gateOptions));

    /// <inheritdoc/>
    public async Task<PilotRunDeltas> ComputeAsync(ArchitectureRunDetail detail, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArchitectureRun run = detail.Run;
        string runId = run.RunId;
        DateTime? committedUtc = detail.Manifest?.Metadata.CreatedUtc;
        TimeSpan? wall = committedUtc is { } c ? c - run.CreatedUtc : null;
        IReadOnlyList<KeyValuePair<string, int>> findings = AggregateFindingsBySeverity(detail);
        ArchitectureFinding? topFinding = SelectTopSeverityFinding(detail);

        (IReadOnlyList<AgentExecutionTrace> traces, int llmCallCount, bool tracesResolved) =
            await TryListExecutionTracesAsync(runId, cancellationToken);

        AgentOutputQualityGateOptions gateOpts = _gateOptions.Value;

        bool pilotStrictFails = false;

        if (tracesResolved && gateOpts.Enabled && gateOpts.Mode == AgentOutputQualityGateMode.PilotStrict)
        {
            RunExplanationSummary? summary = null;

            if (gateOpts.PilotStrictMinFaithfulnessSupportRatio.HasValue && TryParseRunGuid(runId, out Guid runGuid))
            {
                ScopeContext scope = _scopeContextProvider.GetCurrentScope();

                summary = await _runExplanationSummaryService.GetSummaryAsync(scope, runGuid, cancellationToken);
            }

            pilotStrictFails = _pilotEvidenceAggregator.WouldPilotStrictBlockSponsorEvidence(traces, summary);
        }

        (int auditCount, bool auditTruncated) = await TryCountAuditRowsAsync(runId, cancellationToken);
        FindingEvidenceChainResponse? chain = topFinding is null ? null : await TryBuildEvidenceChainAsync(runId, topFinding.FindingId, cancellationToken);
        bool isDemo = ContosoRetailDemoIdentifiers.IsDemoRunId(runId) || ContosoRetailDemoIdentifiers.IsDemoRequestId(run.RequestId);
        (int? artifactCount, bool artifactResolved) = await TryCountArtifactsAsync(run.GoldenManifestId, cancellationToken);

        return new PilotRunDeltas
        {
            RunCreatedUtc = run.CreatedUtc,
            ManifestCommittedUtc = committedUtc,
            TimeToCommittedManifest = wall,
            FindingsBySeverity = findings,
            AuditRowCount = auditCount,
            AuditRowCountTruncated = auditTruncated,
            LlmCallCount = llmCallCount,
            LlmCallCountResolved = tracesResolved,
            AgentOutputPilotStrictSignalsResolved = tracesResolved,
            AgentOutputPilotStrictViolatesSponsorEvidence = pilotStrictFails,
            TopFindingId = topFinding?.FindingId,
            TopFindingSeverity = topFinding?.Severity.ToString(),
            TopFindingEvidenceChain = chain,
            IsDemoTenant = isDemo,
            SynthesizedArtifactDescriptorCount = artifactCount,
            SynthesizedArtifactDescriptorCountResolved = artifactResolved,
        };
    }

    private async Task<(IReadOnlyList<AgentExecutionTrace> traces, int count, bool resolved)> TryListExecutionTracesAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<AgentExecutionTrace> list =
                await _agentExecutionTraceRepository.GetByRunIdAsync(runId, cancellationToken);

            return (list, list.Count, true);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Pilot delta: execution traces unavailable for run {RunId}; LLM counts and PilotStrict gates not attested.",
                runId);

            return (Array.Empty<AgentExecutionTrace>(), 0, false);
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
        catch (Exception ex)when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Pilot delta: artifact descriptor count unavailable for manifest {ManifestId}; omitting count.",
                goldenManifestId);
            return (null, false);
        }
    }

    /// <summary>Returns severity counts in descending order (highest count first), grouped case-insensitively.</summary>
    private static IReadOnlyList<KeyValuePair<string, int>> AggregateFindingsBySeverity(ArchitectureRunDetail detail)
    {
        return detail.Results.Where(_ => true).SelectMany(static r => r.Findings).Where(_ => true).GroupBy(static f => f.Severity.ToString(), StringComparer.OrdinalIgnoreCase).Select(g => new KeyValuePair<string, int>(g.Key, g.Count())).OrderByDescending(static p => p.Value).ThenBy(static p => p.Key, StringComparer.OrdinalIgnoreCase).ToList();
    }

    /// <summary>Picks the single highest-severity finding; ties broken by first-seen order to keep output deterministic.</summary>
    private static ArchitectureFinding? SelectTopSeverityFinding(ArchitectureRunDetail detail)
    {
        return detail.Results.Where(_ => true).SelectMany(static r => r.Findings).Where(_ => true).OrderByDescending(static f => (int)f.Severity).FirstOrDefault();
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

            int count = await _auditRepository.CountFilteredAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                filter,
                cancellationToken);
            return (count, false);
        }
        catch (Exception ex)when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Pilot delta: audit row count unavailable for run {RunId}; reporting 0.", runId);
            return (0, false);
        }
    }

    private async Task<FindingEvidenceChainResponse?> TryBuildEvidenceChainAsync(string runId, string findingId, CancellationToken cancellationToken)
    {
        try
        {
            return await _evidenceChainService.BuildAsync(runId, findingId, cancellationToken);
        }
        catch (Exception ex)when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Pilot delta: evidence chain unavailable for run {RunId} finding {FindingId}; omitting chain pointers.", runId, findingId);
            return null;
        }
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
