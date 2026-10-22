using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Derives workload-conditioned security control-family expectations from scope metadata (TB-2209).
/// </summary>
public static class WorkloadConditionedSecurityControlFamilyResolver
{
    private static readonly string[] DefaultExpectedFamilies =
    [
        SecurityControlFamilies.IdentityAccess,
        SecurityControlFamilies.NetworkIsolation,
        SecurityControlFamilies.LoggingMonitoring
    ];

    public static IReadOnlyList<string> ResolveExpectedControlFamilies(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(n =>
            string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        if (contextNode is null)
            return DefaultExpectedFamilies;

        IReadOnlyList<string> scopeTokens = TopologyExpectedCategoryResolver.CollectScopeTokens(contextNode);
        HashSet<string> expected = new(DefaultExpectedFamilies, StringComparer.OrdinalIgnoreCase);

        if (scopeTokens.Count > 0)
        {
            IReadOnlyList<string> expectedCategories =
                TopologyExpectedCategoryResolver.ResolveExpectedCategories(graphSnapshot);

            if (expectedCategories.Any(c =>
                    c.Equals(GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
                    || c.Equals(GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase)))
            {
                expected.Add(SecurityControlFamilies.DataProtection);
                expected.Add(SecurityControlFamilies.Encryption);
            }

            if (expectedCategories.Any(c =>
                    c.Equals(GraphTopologyCategories.Compute, StringComparison.OrdinalIgnoreCase)))
            {
                expected.Add(SecurityControlFamilies.VulnerabilityManagement);
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
                expected.Add(SecurityControlFamilies.IdentityAccess);
            }

            if (TopologyExpectedCategoryResolver.ScopeTokensContainAnyKeyword(
                    scopeTokens,
                    "compliance",
                    "regulated",
                    "hipaa",
                    "pci",
                    "sox"))
            {
                expected.Add(SecurityControlFamilies.DataProtection);
                expected.Add(SecurityControlFamilies.LoggingMonitoring);
            }
        }

        UnionPolicyExpectedControlFamilies(contextNode, expected);

        return expected.OrderBy(static f => f, StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static void UnionPolicyExpectedControlFamilies(GraphNode contextNode, HashSet<string> expected)
    {
        if (!contextNode.Properties.TryGetValue(
                ContextGraphPropertyKeys.PolicyExpectedSecurityControlFamilies,
                out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return;
        }

        foreach (string segment in raw.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (string.IsNullOrWhiteSpace(segment))
                continue;

            if (segment.Equals(SecurityControlFamilies.IdentityAccess, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(SecurityControlFamilies.NetworkIsolation, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(SecurityControlFamilies.DataProtection, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(SecurityControlFamilies.Encryption, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(SecurityControlFamilies.LoggingMonitoring, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(SecurityControlFamilies.VulnerabilityManagement, StringComparison.OrdinalIgnoreCase))
            {
                expected.Add(segment);
            }
        }
    }

    public static string ResolveControlFamily(GraphNode securityBaselineNode)
    {
        ArgumentNullException.ThrowIfNull(securityBaselineNode);

        if (securityBaselineNode.Properties.TryGetValue("controlFamily", out string? explicitFamily)
            && !string.IsNullOrWhiteSpace(explicitFamily))
        {
            return explicitFamily.Trim();
        }

        securityBaselineNode.Properties.TryGetValue("controlId", out string? controlId);
        string combined = $"{controlId} {securityBaselineNode.Label}";

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "identity",
                "entra",
                "oauth",
                "sso",
                "authentication",
                "authorization",
                "iam",
                "rbac"))
        {
            return SecurityControlFamilies.IdentityAccess;
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "network",
                "firewall",
                "segmentation",
                "private link",
                "vnet",
                "subnet",
                "nsg",
                "waf"))
        {
            return SecurityControlFamilies.NetworkIsolation;
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "encrypt",
                "tls",
                "ssl",
                "cmk",
                "key rotation",
                "at-rest"))
        {
            return SecurityControlFamilies.Encryption;
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "backup",
                "retention",
                "data protection",
                "dlp",
                "pii",
                "phi"))
        {
            return SecurityControlFamilies.DataProtection;
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "log",
                "monitor",
                "audit",
                "siem",
                "defender",
                "sentinel",
                "alert"))
        {
            return SecurityControlFamilies.LoggingMonitoring;
        }

        if (TopologyExpectedCategoryResolver.DelimitedTextContainsAnyKeyword(
                combined,
                "patch",
                "vulnerab",
                "baseline",
                "hardening",
                "antimalware"))
        {
            return SecurityControlFamilies.VulnerabilityManagement;
        }

        return "general";
    }
}
