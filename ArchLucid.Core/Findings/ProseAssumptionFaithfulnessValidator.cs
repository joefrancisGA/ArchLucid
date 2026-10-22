namespace ArchLucid.Core.Findings;

/// <summary>Rejects prose assumption candidates whose quoted span is not grounded in the source document (DX-55).</summary>
public static class ProseAssumptionFaithfulnessValidator
{
    public static bool IsSpanGrounded(
        ProseAssumptionCandidate candidate,
        IReadOnlyDictionary<string, string> documentBodiesByPath)
    {
        ArgumentNullException.ThrowIfNull(candidate);
        ArgumentNullException.ThrowIfNull(documentBodiesByPath);

        if (string.IsNullOrWhiteSpace(candidate.DocumentPath)
            || string.IsNullOrWhiteSpace(candidate.QuotedSpan))
        {
            return false;
        }

        if (!documentBodiesByPath.TryGetValue(candidate.DocumentPath, out string? body)
            || string.IsNullOrWhiteSpace(body))
        {
            return false;
        }

        if (!body.Contains(candidate.QuotedSpan, StringComparison.Ordinal))
        {
            return false;
        }

        string[] lines = body.Split('\n');

        if (candidate.LineNumber <= 0 || candidate.LineNumber > lines.Length)
        {
            return false;
        }

        string line = lines[candidate.LineNumber - 1];

        return line.Contains(candidate.QuotedSpan, StringComparison.Ordinal);
    }
}
