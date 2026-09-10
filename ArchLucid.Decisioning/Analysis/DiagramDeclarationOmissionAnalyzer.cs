using System.Text.RegularExpressions;

using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Detects declared resources cited from diagram participants that the explicit diagram connector set omits (AS-042).
/// </summary>
public static partial class DiagramDeclarationOmissionAnalyzer
{
    public const int MaxFindings = 20;

    [GeneratedRegex(
        @"/subscriptions/[^/]+/resourceGroups/[^/]+/providers/[^/]+/[^/]+/[^/]+",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex ArmResourceIdRegex();

    public static IReadOnlyList<DiagramDeclarationOmission> Analyze(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (!DiagramAssertedCompletenessPredicate.ClaimsCompleteness(graphSnapshot))
        {
            return [];
        }

        if (graphSnapshot.Nodes is null || graphSnapshot.Nodes.Count == 0)
        {
            return [];
        }

        HashSet<string> diagramParticipantNodeIds = graphSnapshot.Nodes
            .Where(DiagramAssertedCompletenessPredicate.IsDiagramTopologyParticipant)
            .Select(static node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        if (diagramParticipantNodeIds.Count == 0)
        {
            return [];
        }

        List<DiagramDeclarationOmission> omissions = [];

        foreach (GraphNode participant in graphSnapshot.Nodes)
        {
            if (!diagramParticipantNodeIds.Contains(participant.NodeId))
            {
                continue;
            }

            if (participant.Properties is null || participant.Properties.Count == 0)
            {
                continue;
            }

            foreach (KeyValuePair<string, string> property in participant.Properties.OrderBy(static pair => pair.Key, StringComparer.Ordinal))
            {
                if (omissions.Count >= MaxFindings)
                {
                    return omissions;
                }

                TryAddOmission(
                    graphSnapshot.Nodes,
                    diagramParticipantNodeIds,
                    participant,
                    property.Key,
                    property.Value,
                    omissions);
            }
        }

        return omissions;
    }

    private static void TryAddOmission(
        IReadOnlyList<GraphNode> nodes,
        HashSet<string> diagramParticipantNodeIds,
        GraphNode participant,
        string propertyName,
        string propertyValue,
        List<DiagramDeclarationOmission> omissions)
    {
        if (string.IsNullOrWhiteSpace(propertyValue) || IsUnevaluatedExpression(propertyValue))
        {
            return;
        }

        Match armMatch = ArmResourceIdRegex().Match(propertyValue);

        if (armMatch.Success)
        {
            TryAddResolvedOmission(
                nodes,
                diagramParticipantNodeIds,
                participant,
                propertyName,
                propertyValue.Trim(),
                DanglingDeclarationReferenceKind.ArmId,
                omissions,
                armMatch.Value.Trim());
        }

        if (propertyValue.Contains("vault.azure.net", StringComparison.OrdinalIgnoreCase))
        {
            string? vaultName = TryExtractKeyVaultName(propertyValue);

            if (!string.IsNullOrWhiteSpace(vaultName))
            {
            TryAddResolvedOmission(
                nodes,
                diagramParticipantNodeIds,
                participant,
                propertyName,
                propertyValue.Trim(),
                DanglingDeclarationReferenceKind.KeyVaultUri,
                omissions,
                vaultName);
            }
        }
    }

    private static void TryAddResolvedOmission(
        IReadOnlyList<GraphNode> nodes,
        HashSet<string> diagramParticipantNodeIds,
        GraphNode participant,
        string propertyName,
        string referencedToken,
        string referenceKind,
        List<DiagramDeclarationOmission> omissions,
        string lookupToken)
    {
        if (string.IsNullOrWhiteSpace(lookupToken))
        {
            return;
        }

        GraphNode? targetNode = DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, lookupToken)
            ?? DeclarationExistingNodeResolver.FindExistingDeclaredNode(nodes, referencedToken);

        if (targetNode is null || diagramParticipantNodeIds.Contains(targetNode.NodeId))
        {
            return;
        }

        if (omissions.Any(candidate =>
                string.Equals(candidate.DiagramParticipantNodeId, participant.NodeId, StringComparison.Ordinal)
                && string.Equals(candidate.OmittedDeclarationNodeId, targetNode.NodeId, StringComparison.Ordinal)
                && string.Equals(candidate.PropertyName, propertyName, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        omissions.Add(
            new DiagramDeclarationOmission(
                participant.NodeId,
                participant.Label ?? participant.NodeId,
                targetNode.NodeId,
                targetNode.Label ?? targetNode.NodeId,
                propertyName,
                referencedToken,
                referenceKind));
    }

    private static string? TryExtractKeyVaultName(string propertyValue)
    {
        string trimmed = propertyValue.Trim();
        int schemeIndex = trimmed.IndexOf("://", StringComparison.Ordinal);

        if (schemeIndex >= 0)
        {
            trimmed = trimmed[(schemeIndex + 3)..];
        }

        int dotIndex = trimmed.IndexOf('.', StringComparison.Ordinal);

        if (dotIndex <= 0)
        {
            return null;
        }

        return trimmed[..dotIndex];
    }

    private static bool IsUnevaluatedExpression(string value)
    {
        return value.Contains("[parameters(", StringComparison.OrdinalIgnoreCase)
            || value.Contains("[variables(", StringComparison.OrdinalIgnoreCase)
            || value.Contains("${", StringComparison.Ordinal)
            || value.Contains("var.", StringComparison.OrdinalIgnoreCase)
            || value.Contains("local.", StringComparison.OrdinalIgnoreCase)
            || value.Contains("module.", StringComparison.OrdinalIgnoreCase);
    }
}
