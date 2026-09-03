using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPackDryRun.Stages;

public interface IPolicyPackDryRunRedactAuditStage
{
    Dictionary<string, double> ParseThresholds(IReadOnlyDictionary<string, string> proposedThresholds);
    string RedactProposedThresholdsJson(IReadOnlyDictionary<string, string> proposedThresholds);
    Task TryLogAuditAsync(
        Guid policyPackId,
        string proposedThresholdsRedactedJson,
        IReadOnlyList<string> evaluatedRunIds,
        PolicyPackDryRunDeltaCounts deltaCounts,
        CancellationToken cancellationToken);
}
