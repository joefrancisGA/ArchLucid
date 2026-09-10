using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-059: stamp heuristic semantic support bands on emit after provenance and citation excerpts exist.
/// </summary>
public static class FindingSemanticSupportBandEmissionApplicator
{
    public static void Apply(IReadOnlyList<Finding> findings) =>
        Apply(findings, new FindingSemanticSupportBandOptions(), NoOpFindingSemanticSupportBandLlmJudge.Instance);

    public static void Apply(
        IReadOnlyList<Finding> findings,
        FindingSemanticSupportBandOptions options,
        IFindingSemanticSupportBandLlmJudge llmJudge)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(llmJudge);

        foreach (Finding finding in findings)
        {
            if (finding.Classification == FindingClassification.ChecklistCoverage)
                continue;

            if (finding.EvidenceRefs.Count == 0)
                continue;

            string findingMessage = FindingSemanticSupportBandClaimMessageResolver.Resolve(finding);
            IReadOnlyList<string> citationExcerpts = BuildCitationExcerpts(finding);

            if (citationExcerpts.Count == 0)
                continue;

            FindingSemanticSupportBand? llmBand = options.EnableLlmJudge
                ? llmJudge.TryScore(finding, findingMessage, citationExcerpts, options)
                : null;

            FindingSemanticSupportBand scoredBand = llmBand
                ?? FindingSemanticSupportBandScorer.Score(findingMessage, citationExcerpts);

            if (scoredBand == FindingSemanticSupportBand.NotScored)
                continue;

            finding.SemanticSupportBand = scoredBand;
        }
    }

    private static IReadOnlyList<string> BuildCitationExcerpts(Finding finding)
    {
        return finding.EvidenceRefs
            .Where(static reference => !string.IsNullOrWhiteSpace(reference))
            .Select(static reference => reference.Trim())
            .ToList();
    }
}
