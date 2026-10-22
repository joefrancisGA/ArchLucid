namespace ArchLucid.Application.Tenancy;

/// <summary>Operator-facing tenant catalog migration status for maintenance banners (TB-2045).</summary>
public sealed class TenantMigrationStatusSnapshot
{
    public bool InMigration
    {
        get;
        init;
    }

    public string? Message
    {
        get;
        init;
    }

    public string? CorrelationId
    {
        get;
        init;
    }

    public string? Stage
    {
        get;
        init;
    }

    public Guid? MigrationId
    {
        get;
        init;
    }

    public string? LastVerificationError
    {
        get;
        init;
    }
}
