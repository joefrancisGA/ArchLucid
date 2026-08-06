namespace ArchLucid.Core.Tenancy;

/// <summary>Active or completed tenant catalog migration row.</summary>
public sealed class TenantCatalogMigrationRecord
{
    public Guid MigrationId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string CorrelationId
    {
        get;
        init;
    } = string.Empty;

    public TenantCatalogMigrationStage Stage
    {
        get;
        init;
    }

    public DateTimeOffset StartedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? CompletedUtc
    {
        get;
        init;
    }

    public string MaintenanceMessage
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset? VerificationPassedUtc
    {
        get;
        init;
    }

    public string? LastVerificationError
    {
        get;
        init;
    }

    public bool IsActive => CompletedUtc is null;
}
