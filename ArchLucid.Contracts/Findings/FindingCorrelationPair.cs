namespace ArchLucid.Contracts.Findings;

/// <summary>One correlated finding pair across two committed runs.</summary>
public sealed class FindingCorrelationPair
{
    public string LeftFindingId
    {
        get;
        set;
    } = string.Empty;

    public string RightFindingId
    {
        get;
        set;
    } = string.Empty;

    public FindingCorrelationMethod Method
    {
        get;
        set;
    }

    public string DedupeKey
    {
        get;
        set;
    } = string.Empty;
}
