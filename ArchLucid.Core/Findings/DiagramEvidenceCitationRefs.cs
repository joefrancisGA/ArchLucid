namespace ArchLucid.Core.Findings;

/// <summary>
///     Grammar and resolver for <c>diagram:{evidenceItemId}:{shapeOrEdgeId}</c> citations (AS-022).
///     Concrete for demotion when the shape exists on the package; not semantic faithfulness (TB-1228).
/// </summary>
public static class DiagramEvidenceCitationRefs
{
    public const string Prefix = "diagram:";

    public static string Format(string? evidenceItemId, string shapeOrEdgeId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(shapeOrEdgeId);

        string evidence = string.IsNullOrWhiteSpace(evidenceItemId) ? string.Empty : evidenceItemId.Trim();
        string shapeId = shapeOrEdgeId.Trim();

        return $"{Prefix}{evidence}:{shapeId}";
    }

    public static bool TryParse(string? evidenceRef, out DiagramEvidenceCitation? citation)
    {
        citation = null;

        if (string.IsNullOrWhiteSpace(evidenceRef))
        {
            return false;
        }

        string trimmed = evidenceRef.Trim();

        if (!trimmed.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string remainder = trimmed[Prefix.Length..];
        int separatorIndex = remainder.LastIndexOf(':');

        if (separatorIndex < 0)
        {
            return false;
        }

        string shapeOrEdgeId = remainder[(separatorIndex + 1)..].Trim();

        if (string.IsNullOrWhiteSpace(shapeOrEdgeId))
        {
            return false;
        }

        string evidenceItemId = remainder[..separatorIndex].Trim();

        citation = new DiagramEvidenceCitation
        {
            EvidenceItemId = evidenceItemId,
            ShapeOrEdgeId = shapeOrEdgeId,
        };

        return true;
    }

    public static bool IsPackageResolvable(string? evidenceRef, DiagramPackageCitationIndex? packageIndex)
    {
        if (!TryParse(evidenceRef, out DiagramEvidenceCitation? citation) || citation is null)
        {
            return false;
        }

        if (packageIndex is null)
        {
            return false;
        }

        return packageIndex.Contains(citation.EvidenceItemId, citation.ShapeOrEdgeId);
    }
}
