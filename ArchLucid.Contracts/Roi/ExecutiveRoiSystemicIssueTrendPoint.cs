namespace ArchLucid.Contracts.Roi;

/// <summary>Monthly count for a recurring systemic issue theme (Improvement #12).</summary>
public sealed class ExecutiveRoiSystemicIssueTrendPoint
{
    /// <summary>Calendar month key (<c>yyyy-MM</c>).</summary>
    public string MonthKey
    {
        get;
        set;
    } = string.Empty;

    public int Count
    {
        get;
        set;
    }
}
