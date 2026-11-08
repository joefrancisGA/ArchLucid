using ArchLucid.Application.Analysis;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Pilots;

public sealed partial class PilotRunDeltaComputer
{
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
            IReadOnlyList<AgentExecutionTrace> merged = await LoadMergedExecutionTracesAsync(runId, cancellationToken)
                .ConfigureAwait(false);

            return ([], merged.Count, true);
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
            IReadOnlyList<AgentExecutionTrace> list = await LoadMergedExecutionTracesAsync(runId, cancellationToken)
                .ConfigureAwait(false);

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

    private async Task<IReadOnlyList<AgentExecutionTrace>> LoadMergedExecutionTracesAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        ScopeContext traceScope = _scopeContextProvider.GetCurrentScope();
        string lookupRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);

        return await AnalysisRunIdCanonicalization.LoadExecutionTracesByRunIdAsync(
            _agentExecutionTraceRepository,
            traceScope,
            lookupRunId,
            cancellationToken).ConfigureAwait(false);
    }
}
