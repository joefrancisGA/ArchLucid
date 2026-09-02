using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteQualityGateStage" />
public sealed class ArchitectureRunExecuteQualityGateStage(
    IOptions<AgentOutputQualityGateOptions> agentOutputQualityGateOptions,
    IAgentOutputTraceEvaluationHook outputTraceEvaluationHook,
    ArchitectureRunExecutePostExecuteHooks postExecuteHooks,
    IArchitectureRunExecuteQualityGateRetryStage qualityGateRetryStage,
    ILogger<ArchitectureRunExecuteQualityGateStage> logger) : IArchitectureRunExecuteQualityGateStage
{
    private readonly IOptions<AgentOutputQualityGateOptions> _agentOutputQualityGateOptions =
        agentOutputQualityGateOptions ?? throw new ArgumentNullException(nameof(agentOutputQualityGateOptions));

    private readonly IAgentOutputTraceEvaluationHook _outputTraceEvaluationHook =
        outputTraceEvaluationHook ?? throw new ArgumentNullException(nameof(outputTraceEvaluationHook));

    private readonly ArchitectureRunExecutePostExecuteHooks _postExecuteHooks =
        postExecuteHooks ?? throw new ArgumentNullException(nameof(postExecuteHooks));

    private readonly IArchitectureRunExecuteQualityGateRetryStage _qualityGateRetryStage =
        qualityGateRetryStage ?? throw new ArgumentNullException(nameof(qualityGateRetryStage));

    private readonly ILogger<ArchitectureRunExecuteQualityGateStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<IReadOnlyList<AgentResult>> RunQualityGateTraceEvaluationLoopAsync(
        string runId,
        string actor,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IReadOnlyList<AgentTask> tasks,
        IReadOnlyList<AgentResult> initialResults,
        CancellationToken cancellationToken)
    {
        List<AgentResult> mutableResults = initialResults.ToList();
        IReadOnlyList<AgentResult> results = initialResults;
        int qualityGateAutoRetryAttempt = 0;
        int maxAutoRetries = Math.Max(0, _agentOutputQualityGateOptions.Value.MaxAutoRetries);

        while (true)
        {
            try
            {
                await _outputTraceEvaluationHook.AfterSuccessfulExecuteAsync(runId, cancellationToken);
                results = mutableResults;
                break;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (AgentOutputQualityGateRejectedException ex)
                when (_agentOutputQualityGateOptions.Value is { BlockRunOnReject: true, EnforceOnReject: true }
                      && qualityGateAutoRetryAttempt < maxAutoRetries)
            {
                qualityGateAutoRetryAttempt++;

                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation(
                        "Quality gate rejected trace; auto-retrying agent {AgentLabel} for RunId={RunId} attempt {Attempt}/{MaxAttempts} TraceId={TraceId}",
                        ex.AgentLabel,
                        LogSanitizer.Sanitize(runId),
                        qualityGateAutoRetryAttempt,
                        maxAutoRetries,
                        LogSanitizer.Sanitize(ex.TraceId));
                }

                mutableResults = await _qualityGateRetryStage.RetryQualityGateRejectedAgentAsync(
                    runId,
                    request,
                    evidence,
                    tasks,
                    mutableResults,
                    ex,
                    cancellationToken);
            }
            catch (AgentOutputQualityGateRejectedException ex)
                when (_agentOutputQualityGateOptions.Value is { BlockRunOnReject: true, EnforceOnReject: true })
            {
                await _postExecuteHooks.RecordQualityGateRejectedAsync(runId, actor, ex, cancellationToken);
                throw;
            }
            catch (Exception ex)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        ex,
                        "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged.",
                        LogSanitizer.Sanitize(runId));
                }

                _logger.LogError(
                    ex,
                    "Agent output trace evaluation hook failed after successful execute for RunId={RunId}; run outcome unchanged. CorrelationId={CorrelationId}",
                    LogSanitizer.Sanitize(runId),
                    System.Diagnostics.Activity.Current?.Id ?? "unknown");
                results = mutableResults;
                break;
            }
        }

        return results;
    }
}
