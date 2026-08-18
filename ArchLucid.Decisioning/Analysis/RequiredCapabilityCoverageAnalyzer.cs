using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Scores required-capability obligations from the context snapshot against graph evidence (TB-2346).
/// </summary>
public sealed class RequiredCapabilityCoverageAnalyzer
{
    public RequiredCapabilityCoverageResult Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(n =>
            string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        if (contextNode is null
            || !contextNode.Properties.TryGetValue(
                ContextGraphPropertyKeys.RequiredCapabilities,
                out string? requiredRaw)
            || string.IsNullOrWhiteSpace(requiredRaw))
        {
            return new RequiredCapabilityCoverageResult
            {
                RequiredCapabilities = [],
                SatisfiedCapabilities = [],
                MissingCapabilities = [],
            };
        }

        List<string> requiredCapabilities = requiredRaw
            .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        HashSet<string> evidenceTokens = CollectEvidenceTokens(graphSnapshot);
        List<string> satisfied = [];
        List<string> missing = [];

        foreach (string capability in requiredCapabilities)
        {
            if (CapabilitySatisfied(capability, evidenceTokens))
                satisfied.Add(capability);
            else
                missing.Add(capability);
        }

        return new RequiredCapabilityCoverageResult
        {
            RequiredCapabilities = requiredCapabilities,
            SatisfiedCapabilities = satisfied,
            MissingCapabilities = missing,
        };
    }

    private static HashSet<string> CollectEvidenceTokens(GraphSnapshot graphSnapshot)
    {
        HashSet<string> tokens = new(StringComparer.OrdinalIgnoreCase);
        string[] nodeTypes =
        [
            GraphNodeTypes.TopologyResource,
            GraphNodeTypes.SecurityBaseline,
            GraphNodeTypes.Requirement,
            GraphNodeTypes.PolicyControl,
            GraphNodeTypes.QualityAttribute,
            GraphNodeTypes.Assumption,
        ];

        foreach (string nodeType in nodeTypes)
        {
            foreach (GraphNode node in graphSnapshot.GetNodesByType(nodeType))
            {
                AppendToken(tokens, node.Label);
                AppendToken(tokens, node.Category);

                foreach (KeyValuePair<string, string> property in node.Properties)
                    AppendToken(tokens, property.Value);
            }
        }

        return tokens;
    }

    private static bool CapabilitySatisfied(string capability, HashSet<string> evidenceTokens)
    {
        string normalized = NormalizeCapability(capability);

        if (evidenceTokens.Contains(normalized))
            return true;

        foreach (string token in evidenceTokens)
        {
            if (token.Contains(normalized, StringComparison.OrdinalIgnoreCase)
                || normalized.Contains(token, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static string NormalizeCapability(string capability) =>
        capability.Trim().Replace('-', ' ').Replace('_', ' ');

    private static void AppendToken(HashSet<string> tokens, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        tokens.Add(value.Trim());

        foreach (string part in value.Split([' ', '/', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            tokens.Add(part);
    }
}
