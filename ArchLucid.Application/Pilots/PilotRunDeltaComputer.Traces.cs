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
}
