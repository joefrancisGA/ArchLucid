namespace ArchLucid.Core.Tenancy;

/// <summary>Row from <c>dbo.Projects</c> (API scope metadata). <see cref="DeletedUtc" /> is set only when <c>IsDeleted = 1</c>.</summary>
public sealed class ArchitectureProjectRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    /// <summary>Populated only for recycle-bin projections (soft-deleted rows).</summary>
    public DateTimeOffset? DeletedUtc
    {
        get;
        init;
    }
}
