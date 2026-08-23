using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using ArchLucid.Core.Persistence.Ports;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Best-effort enrichment of persisted findings snapshots using agent execution traces (never throws).
/// </summary>
public sealed class FindingsSnapshotEvaluationConfidenceEnricher(
    AgentEvaluationConfidencePipeline confidencePipeline,
    ILogger<FindingsSnapshotEvaluationConfidenceEnricher> logger)
    : IFindingsSnapshotEvaluationConfidenceEnricher
{
    private readonly AgentEvaluationConfidencePipeline _confidencePipeline =
        confidencePipeline ?? throw new ArgumentNullException(nameof(confidencePipeline));

    private readonly ILogger<FindingsSnapshotEvaluationConfidenceEnricher> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task TryEnrichAsync(FindingsSnapshot snapshot, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (snapshot.Findings.Count == 0)
            return;

        try
        {
            string runKey = snapshot.RunId.ToString("N");

            await _confidencePipeline.TryEnrichCoreAsync(
                runKey,
                async (context, ct) =>
                {
                    foreach (Finding finding in snapshot.Findings)
                    {
                        AgentExecutionTrace? trace =
                            AgentEvaluationConfidencePipeline.ResolveTraceForSnapshotFinding(finding, context);

                        (bool schemaPassed, bool referenceMatched) =
                            await _confidencePipeline.EvaluateTraceSignalsAsync(trace, context.Evidence, ct)
                                .ConfigureAwait(false);

                        FindingConfidenceCalculationResult calculated = _confidencePipeline.ComputeFindingConfidence(
                            finding,
                            schemaPassed,
                            referenceMatched);

                        if (calculated.Status != FindingConfidenceStatus.Computed)
                            continue;

                        finding.EvaluationConfidenceScore = calculated.Score;
                        finding.ConfidenceLevel = calculated.Level;
                    }
                },
                cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))

                _logger.LogWarning(
                    ex,
                    "Findings snapshot evaluation confidence enrichment failed for run {RunId}; snapshot saved without enrichment.",
                    snapshot.RunId.ToString("N"));
        }
    }
}
