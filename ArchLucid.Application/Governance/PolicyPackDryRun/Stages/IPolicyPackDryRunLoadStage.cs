using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPackDryRun.Stages;

public interface IPolicyPackDryRunLoadStage
{
    Task<PolicyPackDryRunRunItem> EvaluateSingleRunAsync(
        string runId,
        IReadOnlyDictionary<string, double> parsedThresholds,
        CancellationToken cancellationToken);
}
