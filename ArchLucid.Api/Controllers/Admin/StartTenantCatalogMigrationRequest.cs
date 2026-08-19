using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Body for <c>POST /v1/admin/tenants/{tenantId}/catalog-migration/start</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request DTO; auto-properties only.")]
public sealed class StartTenantCatalogMigrationRequest
{
    public string CorrelationId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");
}
