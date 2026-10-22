using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.Runs.Orchestration;

internal static class TopologyProposalEndpointArmKeys
{
    internal static bool ArmResourceIdMatches(string candidate, string? nodeResourceId)
    {
        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(candidate)
            || !GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(nodeResourceId))
        {
            return false;
        }

        return string.Equals(
            GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(candidate),
            GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(nodeResourceId!),
            StringComparison.Ordinal);
    }

    internal static void AddArmResourceIdEndpointKeys(HashSet<string> endpointKeys, string? resourceId)
    {
        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(resourceId))
            return;

        TopologyProposalRelationshipEndpointIndex.AddEndpointKey(endpointKeys, resourceId);
        TopologyProposalRelationshipEndpointIndex.AddEndpointKey(
            endpointKeys,
            GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(resourceId!));
    }

    internal static void AddArmResourceIdResolutionAliases(
        Dictionary<string, string> aliasToNodeId,
        string? resourceId,
        string nodeId)
    {
        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(resourceId))
            return;

        TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(aliasToNodeId, resourceId, nodeId);
        TopologyProposalRelationshipEndpointIndex.AddResolutionAlias(
            aliasToNodeId,
            GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(resourceId!),
            nodeId);
    }

    internal static bool EndpointKeyIsKnownViaArmNormalization(string trimmed, HashSet<string> knownEndpointKeys)
    {
        if (!GraphAzureInventoryReconciliationAnalyzer.LooksLikeArmResourceId(trimmed))
            return false;

        return knownEndpointKeys.Contains(
            GraphAzureInventoryReconciliationAnalyzer.NormalizeArmResourceId(trimmed));
    }
}
