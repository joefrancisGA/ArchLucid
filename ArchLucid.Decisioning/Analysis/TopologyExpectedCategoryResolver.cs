using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Derives workload-conditioned topology pillar expectations from graph context metadata.
///     When scope signals are absent, all four canonical pillars are expected (legacy default).
/// </summary>
public static class TopologyExpectedCategoryResolver
{
    private static readonly string[] DefaultExpected =
    [
        GraphTopologyCategories.Network,
        GraphTopologyCategories.Compute,
        GraphTopologyCategories.Storage,
        GraphTopologyCategories.Data
    ];

    public static IReadOnlyList<string> ResolveExpectedCategories(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(n =>
            string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        if (contextNode is null)
            return DefaultExpected;

        IReadOnlyList<string> scopeTokens = CollectScopeTokens(contextNode);
        HashSet<string> expected = new(DefaultExpected, StringComparer.OrdinalIgnoreCase);

        if (scopeTokens.Count > 0)
        {
            if (SuggestsStaticOrCdnWorkload(scopeTokens) && !MentionsObjectStorage(scopeTokens))
                expected.Remove(GraphTopologyCategories.Storage);

            if (SuggestsServerlessWorkload(scopeTokens) && !MentionsNetworkIsolation(scopeTokens))
                expected.Remove(GraphTopologyCategories.Network);

            if (SuggestsApiWithoutDatastore(scopeTokens))
                expected.Remove(GraphTopologyCategories.Data);

            if (MentionsIdentityWorkload(scopeTokens))
                expected.Add(GraphTopologyCategories.Identity);
        }

        UnionPolicyExpectedTopologyCategories(contextNode, expected);

        return expected.OrderBy(static c => c, StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static void UnionPolicyExpectedTopologyCategories(GraphNode contextNode, HashSet<string> expected)
    {
        if (!contextNode.Properties.TryGetValue(
                ContextGraphPropertyKeys.PolicyExpectedTopologyCategories,
                out string? raw)
            || string.IsNullOrWhiteSpace(raw))
        {
            return;
        }

        foreach (string segment in raw.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (string.IsNullOrWhiteSpace(segment))
                continue;

            if (segment.Equals(GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(GraphTopologyCategories.Compute, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
                || segment.Equals(GraphTopologyCategories.Identity, StringComparison.OrdinalIgnoreCase))
            {
                expected.Add(segment);
            }
        }
    }

    public static IReadOnlyList<string> CollectScopeTokens(GraphNode contextNode)
    {
        List<string> tokens = [];

        AppendPipeSeparated(tokens, contextNode.Properties, ContextGraphPropertyKeys.RequiredCapabilities);
        AppendPipeSeparated(tokens, contextNode.Properties, ContextGraphPropertyKeys.TopologyHints);
        AppendPipeSeparated(tokens, contextNode.Properties, ContextGraphPropertyKeys.Constraints);

        return tokens;
    }

    private static void AppendPipeSeparated(
        List<string> tokens,
        Dictionary<string, string> properties,
        string key)
    {
        if (!properties.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return;

        foreach (string segment in raw.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!string.IsNullOrWhiteSpace(segment))
                tokens.Add(segment);
        }
    }

    private static bool SuggestsStaticOrCdnWorkload(IReadOnlyList<string> tokens) =>
        ContainsAnyKeyword(tokens, "spa", "static", "cdn", "front door", "frontdoor", "static web");

    private static bool MentionsObjectStorage(IReadOnlyList<string> tokens) =>
        ContainsAnyKeyword(tokens, "blob", "object storage", "archive", "storage account", "s3", "gcs");

    private static bool SuggestsServerlessWorkload(IReadOnlyList<string> tokens) =>
        ContainsAnyKeyword(tokens, "serverless", "functions", "lambda", "cloud functions");

    private static bool MentionsNetworkIsolation(IReadOnlyList<string> tokens) =>
        ContainsAnyKeyword(tokens, "vnet", "subnet", "private endpoint", "private link", "vpn", "network");

    private static bool SuggestsApiWithoutDatastore(IReadOnlyList<string> tokens)
    {
        bool mentionsApi = ContainsAnyKeyword(tokens, "api", "rest", "graphql", "http api");
        bool mentionsDatastore = ContainsAnyKeyword(
            tokens,
            "sql",
            "database",
            "datastore",
            "cosmos",
            "postgres",
            "mysql",
            "rds",
            "dynamodb");

        return mentionsApi && !mentionsDatastore;
    }

    private static bool MentionsIdentityWorkload(IReadOnlyList<string> tokens) =>
        ContainsAnyKeyword(tokens, "identity", "entra", "key vault", "keyvault", "oauth", "sso");

    private static bool ContainsAnyKeyword(IReadOnlyList<string> tokens, params string[] keywords)
    {
        foreach (string token in tokens)
        {
            foreach (string keyword in keywords)
            {
                if (token.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
        }

        return false;
    }
}
