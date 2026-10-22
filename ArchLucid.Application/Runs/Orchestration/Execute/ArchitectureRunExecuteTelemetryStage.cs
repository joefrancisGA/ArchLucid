using System.Diagnostics;

using ArchLucid.Application.Diagnostics;
using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Common;
using ArchLucid.Core;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteTelemetryStage" />
public sealed class ArchitectureRunExecuteTelemetryStage(
    IOptions<AgentExecutionOptions> agentExecutionOptions,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
    ILogger<ArchitectureRunExecuteTelemetryStage> logger) : IArchitectureRunExecuteTelemetryStage
{
    private readonly IOptions<AgentExecutionOptions> _agentExecutionOptions =
        agentExecutionOptions ?? throw new ArgumentNullException(nameof(agentExecutionOptions));

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    private readonly ILogger<ArchitectureRunExecuteTelemetryStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<ExecuteRunResult> ExecuteWithTelemetryAsync(
        string runId,
        string actor,
        Func<CancellationToken, Task<ExecuteRunResult>> executeCore,
        Func<string, string, Exception, CancellationToken, Task> recordFailure,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(executeCore);
        ArgumentNullException.ThrowIfNull(recordFailure);

        string executionModeLabel =
            AgentOutputQualityGateTelemetry.ResolveExecutionModeLabel(EffectiveAgentExecutionOptions().Mode);

        using Activity? runActivity = ArchLucidInstrumentation.AgentExecution.StartActivity("architecture.run.execute");
        runActivity?.SetTag("archlucid.run_id", runId);
        runActivity?.SetTag("archlucid.execution_mode", executionModeLabel);

        if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Executing architecture run: RunId={RunId}", LogSanitizer.Sanitize(runId));

        try
        {
            return await executeCore(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCooperativeCanceledException)
        {
            throw;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            runActivity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            runActivity?.AddException(ex);

            if (ex is not RunCostBudgetExceededPartialPersistRecordedException
                and not AgentOutputQualityGateRejectedException)
            {
                await recordFailure(runId, actor, ex, cancellationToken).ConfigureAwait(false);
            }

            throw;
        }
    }

    private AgentExecutionOptions EffectiveAgentExecutionOptions()
    {
        return new AgentExecutionOptions
        {
            Mode = _effectiveAgentExecutionModeAccessor.GetEffectiveMode(),
        };
    }
}
