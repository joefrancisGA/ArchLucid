namespace ArchLucid.Persistence.Tenancy;

/// <summary>Dapper row shape for <see cref="SqlArchitectureProjectRetentionPurgeService"/> OUTPUT.</summary>
internal sealed class SqlArchitectureProjectRetentionPurgeRow
{
    public Guid ProjectId
    {
        get;
        set;
    }

    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }
}
