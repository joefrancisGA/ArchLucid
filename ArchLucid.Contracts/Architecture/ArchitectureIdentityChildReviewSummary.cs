namespace ArchLucid.Contracts.Architecture;

/// <summary>Child review run summary for architecture identity detail (ADR 0074).</summary>
public sealed class ArchitectureIdentityChildReviewSummary
{
    public Guid RunId
    {
        get;
        set;
    }

    public string? Description
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }
}
