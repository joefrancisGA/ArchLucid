using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>AS-060: score + hash inputs for overlay persistence without mutating sealed finding prose.</summary>
public static class FindingSemanticSupportBandOverlayScoring
{
    public static FindingSemanticSupportBandOverlayScoreResult ScoreFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string findingMessage = FindingSemanticSupportBandClaimMessageResolver.Resolve(finding);
        IReadOnlyList<string> citationExcerpts = BuildCitationExcerpts(finding);

        FindingSemanticSupportBand band = finding.SemanticSupportBand
            ?? FindingSemanticSupportBandScorer.Score(findingMessage, citationExcerpts);

        string? evidenceHash = TryHashCitationExcerpts(citationExcerpts);

        return new FindingSemanticSupportBandOverlayScoreResult(
            band,
            FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1,
            evidenceHash);
    }

    private static IReadOnlyList<string> BuildCitationExcerpts(Finding finding)
    {
        if (finding.EvidenceRefs.Count == 0)
            return [];

        return finding.EvidenceRefs
            .Where(static reference => !string.IsNullOrWhiteSpace(reference))
            .Select(static reference => reference.Trim())
            .ToList();
    }

    private static string? TryHashCitationExcerpts(IReadOnlyList<string> citationExcerpts)
    {
        if (citationExcerpts.Count == 0)
            return null;

        StringBuilder builder = new();

        for (int i = 0; i < citationExcerpts.Count; i++)
        {
            if (i > 0)
                builder.Append('\n');

            builder.Append(citationExcerpts[i]);
        }

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(builder.ToString()));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}

public sealed record FindingSemanticSupportBandOverlayScoreResult(
    FindingSemanticSupportBand Band,
    string ScorerVersion,
    string? EvidenceExcerptHashSha256);
