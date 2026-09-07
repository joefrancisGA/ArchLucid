namespace ArchLucid.Core.Retrieval;

/// <summary>Evidence ref formatting for graph community summaries in the insight generator (DX-17).</summary>
public static class InsightGeneratorCommunityEvidenceRefs
{
    public const string Prefix = "community:";

    public static string Format(string communityId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(communityId);

        return $"{Prefix}{communityId.Trim()}";
    }

    public static bool TryParse(string evidenceRef, out string communityId)
    {
        communityId = string.Empty;

        if (string.IsNullOrWhiteSpace(evidenceRef))
            return false;

        if (!evidenceRef.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        communityId = evidenceRef[Prefix.Length..].Trim();

        return !string.IsNullOrWhiteSpace(communityId);
    }
}
