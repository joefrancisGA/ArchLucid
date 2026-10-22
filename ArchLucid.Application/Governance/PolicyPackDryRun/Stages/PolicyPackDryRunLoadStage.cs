using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.PolicyPackDryRun.Stages;

public sealed class PolicyPackDryRunLoadStage(
    IRunDetailQueryService runDetailQueryService,
    IPilotRunDeltaComputer pilotRunDeltaComputer,
    ILogger<PolicyPackDryRunLoadStage> logger) : IPolicyPackDryRunLoadStage
{
    private readonly IPilotRunDeltaComputer _pilotRunDeltaComputer =
        pilotRunDeltaComputer ?? throw new ArgumentNullException(nameof(pilotRunDeltaComputer));
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));
    private readonly ILogger<PolicyPackDryRunLoadStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<PolicyPackDryRunRunItem> EvaluateSingleRunAsync(
        string runId,
        IReadOnlyDictionary<string, double> parsedThresholds,
        CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await TryLoadRunDetailAsync(runId, cancellationToken);
        if (detail is null)
            return new PolicyPackDryRunRunItem { RunId = runId, RunMissing = true };

        PilotRunDeltas deltas = await _pilotRunDeltaComputer.ComputeAsync(detail, cancellationToken);
        IReadOnlyList<PolicyPackDryRunThresholdOutcome> outcomes = ComputeThresholdOutcomes(parsedThresholds, deltas);
        return new PolicyPackDryRunRunItem
        {
            RunId = runId,
            RunMissing = false,
            FindingsBySeverity = deltas.FindingsBySeverity
                .Select(p => new PolicyPackDryRunSeverityCount { Severity = p.Key, Count = p.Value }).ToList(),
            ThresholdOutcomes = outcomes,
            WouldBlock = outcomes.Any(o => o.WouldBreach),
        };
    }

    private async Task<ArchitectureRunDetail?> TryLoadRunDetailAsync(string runId, CancellationToken cancellationToken)
    {
        try { return await _runDetailQueryService.GetRunDetailAsync(runId, cancellationToken); }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarningWithSanitizedUserArg(ex, "Dry-run: failed to load run {RunId}; treating as missing.", runId);
            return null;
        }
    }

    internal static IReadOnlyList<PolicyPackDryRunThresholdOutcome> ComputeThresholdOutcomes(
        IReadOnlyDictionary<string, double> parsedThresholds, PilotRunDeltas deltas)
    {
        List<PolicyPackDryRunThresholdOutcome> outcomes = [];
        foreach (string key in PolicyPackDryRunSupportedThresholdKeys.All)
        {
            if (!parsedThresholds.TryGetValue(key, out double proposed)) continue;
            double actual = key switch
            {
                PolicyPackDryRunSupportedThresholdKeys.MaxCriticalFindings =>
                    deltas.FindingsBySeverity.Where(p => string.Equals(p.Key, "critical", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Value),
                PolicyPackDryRunSupportedThresholdKeys.MaxHighFindings =>
                    deltas.FindingsBySeverity.Where(p => string.Equals(p.Key, "error", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Value),
                PolicyPackDryRunSupportedThresholdKeys.MaxTotalFindings => deltas.FindingsBySeverity.Sum(p => p.Value),
                PolicyPackDryRunSupportedThresholdKeys.MaxTimeToCommitMinutes => deltas.TimeToCommittedManifest?.TotalMinutes ?? 0d,
                _ => 0d,
            };
            outcomes.Add(new PolicyPackDryRunThresholdOutcome { Key = key, ProposedValue = proposed, ActualValue = actual, WouldBreach = actual > proposed });
        }
        return outcomes;
    }
}
