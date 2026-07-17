namespace ArchLucid.Core.Identity;

/// <summary>Canonical ArchLucid human user (<c>dbo.PlatformUsers</c>).</summary>
public sealed class PlatformUserRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public string? PrimaryEmail
    {
        get;
        init;
    }

    public string? NormalizedPrimaryEmail
    {
        get;
        init;
    }

    public string? DisplayName
    {
        get;
        init;
    }

    public PlatformUserStatus Status
    {
        get;
        init;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }

    public Guid AuthVersion
    {
        get;
        init;
    }
}
