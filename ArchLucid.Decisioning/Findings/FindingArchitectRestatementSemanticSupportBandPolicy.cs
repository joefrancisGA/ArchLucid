using ArchLucid.Contracts.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     AS-070: architect restatement is append-only human judgment; semantic support band stays on the typed claim.
/// </summary>
public static class FindingArchitectRestatementSemanticSupportBandPolicy
{
    public static FindingSemanticSupportBand ResolveClaimBand(
        Finding finding,
        IReadOnlyList<string> citationExcerpts)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(citationExcerpts);

        string claimMessage = FindingSemanticSupportBandClaimMessageResolver.Resolve(finding);

        return FindingSemanticSupportBandScorer.Score(claimMessage, citationExcerpts);
    }

    public static FindingSemanticSupportBand ResolveEffectiveClaimBand(
        Finding finding,
        string? architectRestatement,
        IReadOnlyList<string> citationExcerpts)
    {
        FindingSemanticSupportBand claimBand = ResolveClaimBand(finding, citationExcerpts);

        if (string.IsNullOrWhiteSpace(architectRestatement))
            return claimBand;

        FindingSemanticSupportBand restatementWouldBe = FindingSemanticSupportBandScorer.Score(
            architectRestatement.Trim(),
            citationExcerpts);

        return SelectEffectiveClaimBand(claimBand, restatementWouldBe);
    }

    /// <summary>Display band for trail-backed restatement — never Supported (AS-070).</summary>
    public static FindingSemanticSupportBand ResolveRestatementHumanBand(
        string? architectRestatement,
        IReadOnlyList<string> citationExcerpts)
    {
        if (string.IsNullOrWhiteSpace(architectRestatement))
            return FindingSemanticSupportBand.NotScored;

        FindingSemanticSupportBand scoredBand = FindingSemanticSupportBandScorer.Score(
            architectRestatement.Trim(),
            citationExcerpts);

        return CapRestatementHumanBand(scoredBand);
    }

    public static FindingArchitectRestatementSemanticSupportBandResolution Resolve(
        Finding finding,
        string? architectRestatement,
        IReadOnlyList<string> citationExcerpts)
    {
        FindingSemanticSupportBand claimBand = ResolveEffectiveClaimBand(
            finding,
            architectRestatement,
            citationExcerpts);

        FindingSemanticSupportBand restatementBand = ResolveRestatementHumanBand(
            architectRestatement,
            citationExcerpts);

        return new FindingArchitectRestatementSemanticSupportBandResolution(claimBand, restatementBand);
    }

    internal static FindingSemanticSupportBand CapRestatementHumanBand(FindingSemanticSupportBand scoredBand)
    {
        if (scoredBand == FindingSemanticSupportBand.Supported)
            return FindingSemanticSupportBand.NotScored;

        return scoredBand;
    }

    internal static FindingSemanticSupportBand SelectEffectiveClaimBand(
        FindingSemanticSupportBand claimBand,
        FindingSemanticSupportBand restatementWouldBe)
    {
        if (restatementWouldBe == FindingSemanticSupportBand.Supported
            && claimBand != FindingSemanticSupportBand.Supported)
        {
            return claimBand;
        }

        return claimBand;
    }
}

public sealed record FindingArchitectRestatementSemanticSupportBandResolution(
    FindingSemanticSupportBand ClaimBand,
    FindingSemanticSupportBand RestatementHumanBand);
