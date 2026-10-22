using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Derives workload-conditioned requirement themes from scope metadata on the context snapshot node.
/// </summary>
public static class WorkloadConditionedRequirementExpectationResolver
{
    private static readonly string[] DefaultExpectedThemes = ["traceability", "availability"];

    public static IReadOnlyList<string> ResolveExpectedThemes(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(n =>
            string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        if (contextNode is null)
            return DefaultExpectedThemes;

        IReadOnlyList<string> scopeTokens = TopologyExpectedCategoryResolver.CollectScopeTokens(contextNode);
        HashSet<string> expected = new(DefaultExpectedThemes, StringComparer.OrdinalIgnoreCase);

        if (scopeTokens.Count > 0)
        {
            IReadOnlyList<string> expectedCategories =
                TopologyExpectedCategoryResolver.ResolveExpectedCategories(graphSnapshot);

            if (expectedCategories.Any(c =>
                    c.Equals(GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
                    || c.Equals(GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase)))
            {
                expected.Add("data-protection");
            }

            if (expectedCategories.Any(c =>
                    c.Equals(GraphTopologyCategories.Identity, StringComparison.OrdinalIgnoreCase))
                || TopologyExpectedCategoryResolver.ScopeTokensContainAnyKeyword(
                    scopeTokens,
                    "identity",
                    "entra",
                    "oauth",
                    "sso",
                    "key vault",
                    "keyvault"))
            {
                expected.Add("identity-access");
            }

            if (expectedCategories.Any(c =>
                    c.Equals(GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase))
                || TopologyExpectedCategoryResolver.ScopeTokensContainAnyKeyword(
                    scopeTokens,
                    "vnet",
                    "subnet",
                    "private endpoint",
                    "private link",
                    "vpn"))
            {
                expected.Add("network-isolation");
            }

            if (TopologyExpectedCategoryResolver.ScopeTokensContainAnyKeyword(
                    scopeTokens,
                    "compliance",
                    "regulated",
                    "hipaa",
                    "pci",
                    "sox"))
            {
                expected.Add("compliance");
            }
        }

        UnionPolicyExpectedRequirementThemes(contextNode, expected);

        return expected.OrderBy(static t => t, StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static void UnionPolicyExpectedRequirementThemes(GraphNode contextNode, HashSet<string> expected)
    {
        if (!contextNode.Properties.TryGetValue(
                ContextGraphPropertyKeys.PolicyExpectedRequirementThemes,
                out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return;
        }

        foreach (string segment in raw.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!string.IsNullOrWhiteSpace(segment))
                expected.Add(segment);
        }
    }

    public static string ResolveRequirementTheme(GraphNode requirementNode)
    {
        ArgumentNullException.ThrowIfNull(requirementNode);

        if (requirementNode.Properties.TryGetValue("theme", out string? explicitTheme)
            && !string.IsNullOrWhiteSpace(explicitTheme))
        {
            return explicitTheme.Trim();
        }

        string combined = $"{requirementNode.Label} {GetRequirementText(requirementNode)}";

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "identity",
                "entra",
                "oauth",
                "sso",
                "authentication",
                "authorization"))
        {
            return "identity-access";
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "encrypt",
                "retention",
                "backup",
                "data protection",
                "pii",
                "phi"))
        {
            return "data-protection";
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "network",
                "segmentation",
                "firewall",
                "private link",
                "vnet",
                "subnet"))
        {
            return "network-isolation";
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "compliance",
                "audit",
                "regulated",
                "hipaa",
                "pci",
                "sox"))
        {
            return "compliance";
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "availability",
                "sla",
                "resilien",
                "failover",
                "uptime"))
        {
            return "availability";
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "traceab",
                "manifest",
                "decision",
                "requirement"))
        {
            return "traceability";
        }

        return "general";
    }

    private static string GetRequirementText(GraphNode requirementNode) =>
        requirementNode.Properties.TryGetValue("text", out string? text) ? text ?? string.Empty : string.Empty;
}
