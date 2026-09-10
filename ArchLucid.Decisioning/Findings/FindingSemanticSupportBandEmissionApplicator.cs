using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-059: stamp heuristic semantic support bands on emit after provenance and citation excerpts exist.
/// </summary>
public static class FindingSemanticSupportBandEmissionApplicator
{
    public static void Apply(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        foreach (Finding finding in findings)
        {
            if (finding.Classification == FindingClassification.ChecklistCoverage)
                continue;

            if (finding.EvidenceRefs.Count == 0)
                continue;

            string findingMessage = BuildFindingMessage(finding);
            IReadOnlyList<string> citationExcerpts = BuildCitationExcerpts(finding);

            if (citationExcerpts.Count == 0)
                continue;

            FindingSemanticSupportBand scoredBand =
                FindingSemanticSupportBandScorer.Score(findingMessage, citationExcerpts);

            if (scoredBand == FindingSemanticSupportBand.NotScored)
                continue;

            finding.SemanticSupportBand = scoredBand;
        }
    }

    private static string BuildFindingMessage(Finding finding)
    {
        if (!string.IsNullOrWhiteSpace(finding.Rationale))
            return finding.Rationale.Trim();

        return finding.Title.Trim();
    }

    private static IReadOnlyList<string> BuildCitationExcerpts(Finding finding)
    {
        return finding.EvidenceRefs
            .Where(static reference => !string.IsNullOrWhiteSpace(reference))
            .Select(static reference => reference.Trim())
            .ToList();
    }
}
