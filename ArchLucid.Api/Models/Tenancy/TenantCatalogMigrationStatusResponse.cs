using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Tenancy;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class TenantCatalogMigrationStatusResponse
{
    public bool InMigration
    {
        get;
        set;
    }

    public string? Message
    {
        get;
        set;
    }

    public string? CorrelationId
    {
        get;
        set;
    }

    public string? Stage
    {
        get;
        set;
    }

    public Guid? MigrationId
    {
        get;
        set;
    }

    public string? LastVerificationError
    {
        get;
        set;
    }
}
