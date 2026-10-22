namespace ArchLucid.Contracts.Architecture;

/// <summary>Read-only architecture version pin for identity desk (ADR 0074 / migration 339).</summary>
public sealed class ArchitectureIdentityVersionSummary
{
    public Guid ArchitectureVersionId
    {
        get;
        set;
    }

    public int VersionNumber
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public Guid? LinkedReviewId
    {
        get;
        set;
    }
}
