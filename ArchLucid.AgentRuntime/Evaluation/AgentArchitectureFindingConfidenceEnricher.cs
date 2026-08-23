using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     After trace evaluation metrics run, stamps each <see cref="ArchitectureFinding" /> with deterministic evaluation
///     confidence (never throws to callers).
/// </summary>
public sealed class AgentArchitectureFindingConfidenceEnricher(
    IAgentResultRepository agentResultRepository,
    AgentEvaluationConfidencePipeline confidencePipeline,
    ILogger<AgentArchitectureFindingConfidenceEnricher> logger) : IAgentArchitectureFindingConfidenceEnricher
{
    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly AgentEvaluationConfidencePipeline _confidencePipeline =
        confidencePipeline ?? throw new ArgumentNullException(nameof(confidencePipeline));

    private readonly ILogger<AgentArchitectureFindingConfidenceEnricher> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task TryEnrichRunAsync(string runId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return;

        try
        {
            await _confidencePipeline.TryEnrichCoreAsync(
                runId,
                async (context, ct) =>
                {
                    IReadOnlyList<AgentResult> results =
                        await _agentResultRepository
                            .GetByRunIdAsync(context.Scope, runId.Trim(), ct)
                            .ConfigureAwait(false);

                    if (results.Count == 0)
                        return;

                    foreach (AgentResult result in results)
                    {
                        context.TraceByTaskId.TryGetValue(result.TaskId, out AgentExecutionTrace? traceForAgent);

                        (bool schemaPassed, bool referenceMatched) =
                            await _confidencePipeline
                                .EvaluateTraceSignalsAsync(traceForAgent, context.Evidence, ct)
                                .ConfigureAwait(false);

                        bool touched = false;

                        foreach (ArchitectureFinding finding in result.Findings)
                        {
                            if (finding.EvidenceRefs.Count == 0)
                            {
                                finding.ConfidenceLevel = FindingConfidenceLevel.Low;
                                finding.EvaluationConfidenceScore = 44;
                                touched = true;
                                continue;
                            }

                            Finding shaped = FindingFactory.CreateFromAgentArchitectureFinding(finding, result, traceForAgent);

                            FindingConfidenceCalculationResult calculated = _confidencePipeline.ComputeFindingConfidence(
                                shaped,
                                schemaPassed,
                                referenceMatched);

                            if (calculated.Status != FindingConfidenceStatus.Computed)
                                continue;

                            finding.EvaluationConfidenceScore = calculated.Score;
                            finding.ConfidenceLevel = calculated.Level;
                            touched = true;
                        }

                        if (touched)
                            await _agentResultRepository.CreateAsync(result, ct).ConfigureAwait(false);
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

                _logger.LogWarningWithSanitizedUserArg(
                    ex,
                    "Finding evaluation confidence enrichment failed for run {RunId}; continuing without enriched scores.",
                    runId.Trim());
        }
    }
}
