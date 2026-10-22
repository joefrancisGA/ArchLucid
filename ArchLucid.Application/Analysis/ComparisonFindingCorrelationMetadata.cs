namespace ArchLucid.Application.Analysis;

using ArchLucid.Contracts.Findings;

/// <summary>
///     Documents how findings were correlated in a comparison export (ADR 0063 / TB-2043).
/// </summary>
public sealed class ComparisonFindingCorrelationMetadata
{
    public const string DedupeKeyFormat = CrossReviewFindingCorrelationResult.DedupeKeyFormat;

    public string PrimaryCorrelationMethod
    {
        get;
        set;
    } = "PolicyRuleAndFingerprint";

    public string HonestyNote
    {
        get;
        set;
    } = string.Empty;

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

    public int UnmatchedLeftCount
    {
        get;
        set;
    }

    public int UnmatchedRightCount
    {
        get;
        set;
    }
}
