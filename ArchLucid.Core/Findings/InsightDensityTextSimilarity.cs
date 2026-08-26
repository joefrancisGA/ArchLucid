namespace ArchLucid.Core.Findings;

/// <summary>Token-set Jaccard similarity for duplication penalties within a findings snapshot.</summary>
public static class InsightDensityTextSimilarity
{
    internal static double MaxPeerSimilarity(string message, IReadOnlyList<InsightDensityGateCandidate> peers, string candidateKey)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(peers);
        ArgumentException.ThrowIfNullOrWhiteSpace(candidateKey);

        double maxSimilarity = 0;

        foreach (InsightDensityGateCandidate peer in peers)
        {
            if (string.Equals(peer.CandidateKey, candidateKey, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            double similarity = JaccardSimilarity(message, peer.Message);

            if (similarity > maxSimilarity)
            {
                maxSimilarity = similarity;
            }
        }

        return maxSimilarity;
    }

    public static double JaccardSimilarity(string left, string right)
    {
        HashSet<string> leftTokens = Tokenize(left);
        HashSet<string> rightTokens = Tokenize(right);

        if (leftTokens.Count == 0 && rightTokens.Count == 0)
        {
            return 1;
        }

        if (leftTokens.Count == 0 || rightTokens.Count == 0)
        {
            return 0;
        }

        int intersectionCount = leftTokens.Intersect(rightTokens, StringComparer.OrdinalIgnoreCase).Count();
        int unionCount = leftTokens.Union(rightTokens, StringComparer.OrdinalIgnoreCase).Count();

        return unionCount == 0 ? 0 : (double)intersectionCount / unionCount;
    }

    private static HashSet<string> Tokenize(string text)
    {
        HashSet<string> tokens = new(StringComparer.OrdinalIgnoreCase);
        string[] parts = text.Split([' ', '\t', '\r', '\n', '.', ',', ';', ':', '(', ')', '[', ']', '{', '}', '`', '\'', '"'], StringSplitOptions.RemoveEmptyEntries);

        foreach (string part in parts)
        {
            string normalized = part.Trim().ToLowerInvariant();

            if (normalized.Length < 3)
            {
                continue;
            }

            tokens.Add(normalized);
        }

        return tokens;
    }
}
