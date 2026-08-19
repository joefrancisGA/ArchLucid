using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Workspace/project scope for tenant catalog migration projection refresh.</summary>
[ExcludeFromCodeCoverage(Justification = "API request DTO; auto-properties only.")]
public sealed class TenantCatalogMigrationScopeRequest
{
    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }
}
