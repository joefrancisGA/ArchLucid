namespace ArchLucid.Core.Authentication;

/// <summary>Masks API key configuration material for operator UI (never returns full secrets).</summary>
public static class ApiKeyMaterialMasker
{
    public static IReadOnlyList<string> MaskCommaSeparatedSegments(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return [];

        List<string> masked = [];

        ReadOnlySpan<char> span = raw.AsSpan();
        int start = 0;

        for (int i = 0; i <= span.Length; i++)
        {
            if (i < span.Length && span[i] != ',')
                continue;

            ReadOnlySpan<char> piece = span[start..i].Trim();

            if (!piece.IsEmpty)
                masked.Add(MaskSegment(piece.ToString()));

            start = i + 1;
        }

        return masked;
    }

    public static string MaskSegment(string segment)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(segment);

        string trimmed = segment.Trim();

        if (trimmed.Length <= 4)
            return "****";

        return string.Concat("****", trimmed.AsSpan(trimmed.Length - 4));
    }
}
