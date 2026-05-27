using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Explanation;

/// <inheritdoc cref="IFindingEvidenceChainService"/>
public sealed class FindingEvidenceChainService(
    IAuthorityQueryService authorityQuery,
    IScopeContextProvider scopeContextProvider,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IRetrievalGroundingTraceReader retrievalGroundingTraceReader,
    IAuditRepository auditRepository) : IFindingEvidenceChainService
{
    private const int AuditCorrelationTake = 50;

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository.ThrowIfNull();

    private readonly IAuditRepository _auditRepository =
        auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    private readonly IAuthorityQueryService _authorityQuery = authorityQuery.ThrowIfNull();

    private readonly IRetrievalGroundingTraceReader _retrievalGroundingTraceReader =
        retrievalGroundingTraceReader ?? throw new ArgumentNullException(nameof(retrievalGroundingTraceReader));

    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider.ThrowIfNull();

    /// <inheritdoc/>
    public async Task<FindingEvidenceChainResponse?> BuildAsync(
        string runId,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(findingId);

        if (string.IsNullOrWhiteSpace(runId))
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail = await _authorityQuery.GetRunDetailAsync(scope, runGuid, cancellationToken);

        if (detail?.Run is null)
            return null;

        FindingsSnapshot? snapshot = detail.FindingsSnapshot;

        if (snapshot?.Findings is not { Count: > 0 } findings)
            return null;

        Finding? match = findings.FirstOrDefault(f =>
            string.Equals(f.FindingId, findingId, StringComparison.OrdinalIgnoreCase));

        if (match is null)
            return null;

        IReadOnlyList<AgentExecutionTrace> traces =
            await _agentExecutionTraceRepository.GetByRunIdAsync(runId, cancellationToken);

        List<string> traceIds = traces
            .Select(t => t.TraceId)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        IReadOnlyList<RetrievalGroundingTraceRecord> groundingRows =
            await _retrievalGroundingTraceReader.GetByRunIdAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                runGuid,
                cancellationToken);

        IReadOnlyList<AuditEvent> auditEvents = await _auditRepository.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            new AuditEventFilter { RunId = runGuid, Take = AuditCorrelationTake },
            cancellationToken);

        List<string> correlationIds = auditEvents
            .Select(e => e.CorrelationId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        return new FindingEvidenceChainResponse
        {
            RunId = runId,
            FindingId = match.FindingId,
            ManifestVersion = detail.Run.CurrentManifestVersion,
            FindingsSnapshotId = detail.Run.FindingsSnapshotId,
            ContextSnapshotId = detail.Run.ContextSnapshotId,
            GraphSnapshotId = detail.Run.GraphSnapshotId,
            DecisionTraceId = detail.Run.DecisionTraceId,
            GoldenManifestId = detail.Run.GoldenManifestId,
            RelatedGraphNodeIds = match.RelatedNodeIds.ToList(),
            AgentExecutionTraceIds = traceIds,
            RetrievalGroundingTraceIds = groundingRows
                .Select(r => r.TraceId.ToString("D"))
                .ToList(),
            AgentTracePointers = traces
                .Select(MapAgentTracePointer)
                .ToList(),
            RetrievalGroundingPointers = groundingRows
                .Select(MapGroundingPointer)
                .ToList(),
            AuditCorrelationIds = correlationIds,
            SupportHint =
                "Use trace ids with GET /v1/internal/architecture/runs/{runId}/agent-evaluation or the support bundle export; full prompts are redacted at this edge.",
        };
    }

    private static FindingForensicAgentTracePointer MapAgentTracePointer(AgentExecutionTrace trace)
    {
        return new FindingForensicAgentTracePointer
        {
            TraceId = trace.TraceId,
            AgentType = trace.AgentType.ToString(),
            ModelDeploymentName = trace.ModelDeploymentName,
            FullPromptBlobAvailable = !string.IsNullOrWhiteSpace(trace.FullSystemPromptBlobKey)
                                      || !string.IsNullOrWhiteSpace(trace.FullUserPromptBlobKey),
            FullResponseBlobAvailable = !string.IsNullOrWhiteSpace(trace.FullResponseBlobKey),
            InlineFallbackFailed = trace.InlineFallbackFailed == true,
            ProvenanceCorrelationId = trace.ProvenanceCorrelationId,
        };
    }

    private static FindingForensicRetrievalGroundingPointer MapGroundingPointer(RetrievalGroundingTraceRecord row)
    {
        return new FindingForensicRetrievalGroundingPointer
        {
            TraceId = row.TraceId.ToString("D"),
            AgentName = row.AgentName,
            CorpusKind = row.CorpusKind,
            CitationCoverage = row.CitationCoverage,
            AgentExecutionTraceId = row.AgentExecutionTraceId,
        };
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
