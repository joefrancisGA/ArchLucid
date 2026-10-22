using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph.Materialization;

namespace ArchLucid.KnowledgeGraph.Diagram;

/// <summary>
///     Detects diagram shapes that must not mint topology resources (AS-019 / R5).
/// </summary>
public static class StructuredDiagramUnlabeledShapeDetector
{
    public static bool IsUnlabeledResourceShape(ArchitectureDiagramNodeRecord node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (HasMeaningfulDisplayText(node))
        {
            return false;
        }

        if (HasBoundIdentity(node.Label) || HasBoundIdentity(node.Id))
        {
            return false;
        }

        return true;
    }

    public static bool HasMeaningfulDisplayText(ArchitectureDiagramNodeRecord node)
    {
        ArgumentNullException.ThrowIfNull(node);

        if (string.IsNullOrWhiteSpace(node.Label))
        {
            return false;
        }

        // Parser placeholders echo the shape id when no text was extracted (case-sensitive).
        if (string.Equals(node.Label.Trim(), node.Id.Trim(), StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }

    public static bool HasBoundIdentity(string? candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return false;
        }

        string trimmed = candidate.Trim();

        if (trimmed.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return LooksLikeTerraformResourceAddress(trimmed);
    }

    private static bool LooksLikeTerraformResourceAddress(string candidate)
    {
        int lastDot = candidate.LastIndexOf('.');

        if (lastDot <= 0 || lastDot >= candidate.Length - 1)
        {
            return false;
        }

        string resourceType = candidate[..lastDot].Split('.')[^1];

        return resourceType.Contains('_', StringComparison.Ordinal);
    }
}
