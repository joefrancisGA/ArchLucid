namespace ArchLucid.Application.Tenancy;

/// <summary>Outcome of tenant + workspace existence checks for scope-bound HTTP facades.</summary>
public enum TenantWorkspaceScopeOutcome
{
    Success,
    TenantNotFound,
    WorkspaceNotFound,
}
