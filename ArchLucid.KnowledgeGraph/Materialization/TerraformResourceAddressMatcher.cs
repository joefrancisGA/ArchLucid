using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Matches Terraform resource addresses (type.name) to declaration-ingested graph nodes (AS-043).
/// </summary>
public static class TerraformResourceAddressMatcher
{
    public static bool LooksLikeTerraformResourceAddress(string? candidate)
    {
        if (!TryParse(candidate, out _, out _))
        {
            return false;
        }

        return true;
    }

    public static bool NodeMatchesTerraformResourceAddress(GraphNode node, string? terraformAddress)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (!TryParse(terraformAddress, out string resourceType, out string resourceName))
        {
            return false;
        }

        if (!DeclarationExistingNodeResolver.TryReadProperty(node.Properties, "terraformType", out string nodeType))
        {
            return false;
        }

        if (!DeclarationExistingNodeResolver.IdsEqual(nodeType, resourceType))
        {
            return false;
        }

        return DeclarationExistingNodeResolver.IdsEqual(node.Label, resourceName);
    }

    public static bool TryParse(string? candidate, out string resourceType, out string resourceName)
    {
        resourceType = string.Empty;
        resourceName = string.Empty;

        if (string.IsNullOrWhiteSpace(candidate))
        {
            return false;
        }

        string trimmed = candidate.Trim();
        int lastDot = trimmed.LastIndexOf('.');

        if (lastDot <= 0 || lastDot >= trimmed.Length - 1)
        {
            return false;
        }

        string typeSegment = trimmed[..lastDot];
        int typeDot = typeSegment.LastIndexOf('.');

        resourceType = (typeDot >= 0 ? typeSegment[(typeDot + 1)..] : typeSegment).Trim();
        resourceName = trimmed[(lastDot + 1)..].Trim();

        if (string.IsNullOrWhiteSpace(resourceType)
            || string.IsNullOrWhiteSpace(resourceName)
            || !resourceType.Contains('_', StringComparison.Ordinal))
        {
            resourceType = string.Empty;
            resourceName = string.Empty;
            return false;
        }

        return true;
    }
}
