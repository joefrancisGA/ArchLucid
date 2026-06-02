using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Agents;

/// <inheritdoc cref="IAgentConfidenceCalibrationService" />
public sealed class AgentConfidenceCalibrationService(
    IAgentResultRepository agentResultRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentConfidenceCalibrator calibrator,
    IOptions<AgentConfidenceCalibrationOptions> options,
    ILogger<AgentConfidenceCalibrationService> logger) : IAgentConfidenceCalibrationService
{
    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentConfidenceCalibrator _calibrator =
        calibrator ?? throw new ArgumentNullException(nameof(calibrator));

    private readonly AgentConfidenceCalibrationOptions _options =
        (options ?? throw new ArgumentNullException(nameof(options))).Value;

    private readonly ILogger<AgentConfidenceCalibrationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task ApplyCalibratedConfidenceForRunAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!_options.Enabled)
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentResult> results = await _agentResultRepository.GetByRunIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        foreach (AgentResult result in results)
        {
            double calibrated = await _calibrator
                .CalibrateAsync(result.AgentType, result.Confidence, cancellationToken)
                .ConfigureAwait(false);

            result.CalibratedConfidence = calibrated;

            await _agentResultRepository
                .PatchCalibratedConfidenceAsync(result.ResultId, calibrated, cancellationToken)
                .ConfigureAwait(false);
        }

        if (_logger.IsEnabled(LogLevel.Debug))
            logger.LogDebug(
                "Applied calibrated confidence for RunId={RunId} on {Count} agent results.",
                LogSanitizer.Sanitize(runId),
                results.Count);
    }
}
