namespace ArchLucid.Contracts.Architecture;

/// <summary>Summary of one review child of an architecture identity.</summary>
public sealed class ArchitectureIdentityReviewChildSummary
{
    public Guid ReviewRunId
    {
        get;
        set;
    }

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public bool IsSealed
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }
}
