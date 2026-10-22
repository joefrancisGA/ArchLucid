using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class EvidenceValidationSourceReread
{
    private const int HighSeverityExcerptMaxChars = 512;

    public static List<string> AugmentCitedQuotesForHighSeverity(
        SpecialistReviewFinding finding,
        IReadOnlyList<string> citedQuotes,
        IImmutableSourceStore sourceStore)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(citedQuotes);
        ArgumentNullException.ThrowIfNull(sourceStore);

        if (!RequiresSourceReread(finding.Severity))
        {
            return citedQuotes.ToList();
        }

        List<string> augmented = citedQuotes
            .Where(quote => !string.IsNullOrWhiteSpace(quote))
            .ToList();

        foreach (string artifactId in finding.EvidenceArtifactIds)
        {
            if (string.IsNullOrWhiteSpace(artifactId))
            {
                continue;
            }

            string? excerpt = sourceStore.TryReadSourceExcerpt(artifactId, HighSeverityExcerptMaxChars);

            if (string.IsNullOrWhiteSpace(excerpt))
            {
                continue;
            }

            if (!augmented.Any(quote => quote.Contains(excerpt, StringComparison.OrdinalIgnoreCase)))
            {
                augmented.Add(excerpt);
            }
        }

        return augmented;
    }

    private static bool RequiresSourceReread(string severity)
    {
        return severity.Equals("Critical", StringComparison.OrdinalIgnoreCase)
            || severity.Equals("High", StringComparison.OrdinalIgnoreCase);
    }
}
