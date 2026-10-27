using System.Text.RegularExpressions;
using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Layout;

/// <summary>User-visible captions for IDX-08 collapsed singleton resource-group tails.</summary>
public static partial class DiagramForestCollapsedSingletonTailLabels
{
    public static string ResolveResourceGroupCaption(DiagramNode node, string fallback)
    {
        ArgumentNullException.ThrowIfNull(node);
        ArgumentException.ThrowIfNullOrWhiteSpace(fallback);

        if (node.IsCollapsedResourceGroupTail && !string.IsNullOrWhiteSpace(node.Label))
        {
            return node.Label.Trim();
        }

        if (!string.IsNullOrWhiteSpace(node.ArmResourceGroup))
        {
            return node.ArmResourceGroup.Trim();
        }

        return DiagramNodeHumanCaptionFactory.ResourceGroupNotStoredCaption;
    }

    public static int ResolveNeighborhoodResourceCount(IReadOnlyList<DiagramNode> memberNodes)
    {
        ArgumentNullException.ThrowIfNull(memberNodes);

        if (memberNodes.Count == 1
            && memberNodes[0].IsCollapsedResourceGroupTail
            && TryParseCollapsedResourceGroupCount(memberNodes[0].Label, out int collapsedCount))
        {
            return collapsedCount;
        }

        return memberNodes.Count;
    }

    public static bool TryParseCollapsedResourceGroupCount(string? label, out int count)
    {
        count = 0;

        if (string.IsNullOrWhiteSpace(label))
        {
            return false;
        }

        Match match = CollapsedResourceGroupCountPattern().Match(label.Trim());

        if (!match.Success || !int.TryParse(match.Groups[1].Value, out count))
        {
            return false;
        }

        return count > 0;
    }

    [GeneratedRegex(@"^Other resource groups \((\d+)\)$", RegexOptions.CultureInvariant)]
    private static partial Regex CollapsedResourceGroupCountPattern();
}
