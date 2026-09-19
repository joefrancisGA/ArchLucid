using ArchLucid.Contracts.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Ask;

public static class DiagramViewPlanValidator
{
    public const string DefaultHonestyLabel = "Proposed view — existing diagram modes only";

    public static readonly IReadOnlyList<string> AllowedMermaidModes =
    [
        "executive",
        "network",
        "identity",
        "data",
        "dataFlow",
        "dataArchitecture",
        "full",
        "resourceGroup",
        "dependencyNeighborhood",
    ];

    public static bool TryValidate(
        DiagramViewPlan? plan,
        IReadOnlySet<string>? allowedSeedNodeIds,
        out string? failureReason)
    {
        failureReason = null;

        if (plan is null)
        {
            failureReason = "View plan is missing.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(plan.MermaidMode)
            || !AllowedMermaidModes.Contains(plan.MermaidMode, StringComparer.Ordinal))
        {
            failureReason = "View plan mode is not an allowed inventory workbench mode.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(plan.HonestyLabel))
        {
            failureReason = "View plan honesty label is required.";
            return false;
        }

        if (string.Equals(plan.MermaidMode, "resourceGroup", StringComparison.Ordinal)
            && string.IsNullOrWhiteSpace(plan.ResourceGroupName))
        {
            failureReason = "Resource group mode requires a resource group name.";
            return false;
        }

        if (string.Equals(plan.MermaidMode, "dependencyNeighborhood", StringComparison.Ordinal))
        {
            bool hasSeed = !string.IsNullOrWhiteSpace(plan.SeedNodeId);
            bool hasCloudResource = plan.CloudResourceId.HasValue && plan.CloudResourceId.Value != Guid.Empty;

            if (!hasSeed && !hasCloudResource)
            {
                failureReason = "Dependency neighborhood mode requires a seed node or cloud resource id.";
                return false;
            }

            if (hasSeed
                && allowedSeedNodeIds is not null
                && allowedSeedNodeIds.Count > 0
                && !allowedSeedNodeIds.Contains(plan.SeedNodeId!.Trim(), StringComparer.Ordinal))
            {
                failureReason = "Seed node id is not in the scoped outline allowlist.";
                return false;
            }
        }

        if (!string.IsNullOrWhiteSpace(plan.FitTargetNodeId)
            && allowedSeedNodeIds is not null
            && allowedSeedNodeIds.Count > 0
            && !allowedSeedNodeIds.Contains(plan.FitTargetNodeId.Trim(), StringComparer.Ordinal))
        {
            failureReason = "Fit target node id is not in the scoped outline allowlist.";
            return false;
        }

        return true;
    }

    public static HashSet<string> ExtractAllowedSeedNodeIds(InfraEvidenceAskEvidenceBundle bundle)
    {
        HashSet<string> seedIds = new(StringComparer.Ordinal);

        foreach (string line in bundle.EvidenceLines)
        {
            if (!line.StartsWith("outlineSeed=", StringComparison.Ordinal))
                continue;

            string seedId = line["outlineSeed=".Length..].Trim();

            if (seedId.Length > 0)
                seedIds.Add(seedId);
        }

        return seedIds;
    }
}
