namespace ArchLucid.Contracts.Findings;

/// <summary>Aggregate output of cross-review finding correlation between two runs.</summary>
public sealed class CrossReviewFindingCorrelationResult
{
    public const string DedupeKeyFormat = "{policyRuleId}:{normalizedFindingFingerprint}";

    public List<FindingCorrelationPair> MatchedPairs
    {
        get;
        set;
    } = [];

    public List<string> UnmatchedLeftFindingIds
    {
        get;
        set;
    } = [];

    public List<string> UnmatchedRightFindingIds
    {
        get;
        set;
    } = [];

    public int PolicyRuleMatchCount
    {
        get;
        set;
    }

    public int FuzzyMatchCount
    {
        get;
        set;
    }
}
