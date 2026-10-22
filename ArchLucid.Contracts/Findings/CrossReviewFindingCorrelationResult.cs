using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Findings;

/// <summary>Aggregate output of cross-review finding correlation between two runs.</summary>
public sealed class CrossReviewFindingCorrelationResult
{
    public const string DedupeKeyFormat = "{policyRuleId}:{normalizedFindingFingerprint}";

    private List<FindingCorrelationPair> matchedPairs = [];

    public List<FindingCorrelationPair> MatchedPairs
    {
        get => matchedPairs;
        set => matchedPairs = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> unmatchedLeftFindingIds = [];

    public List<string> UnmatchedLeftFindingIds
    {
        get => unmatchedLeftFindingIds;
        set => unmatchedLeftFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> unmatchedRightFindingIds = [];

    public List<string> UnmatchedRightFindingIds
    {
        get => unmatchedRightFindingIds;
        set => unmatchedRightFindingIds = ContractCollectionDefaults.Coalesce(value);
    }

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
