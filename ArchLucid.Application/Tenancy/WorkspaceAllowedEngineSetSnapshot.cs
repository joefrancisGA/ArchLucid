namespace ArchLucid.Application.Tenancy;

public enum WorkspaceAllowedEngineSetSource
{
    CatalogDefault = 0,
    TenantOverride = 1,
}

public sealed record WorkspaceAllowedEngineSetSnapshot(
    IReadOnlyList<string> AllowedAliasIds,
    string DefaultAliasId,
    WorkspaceAllowedEngineSetSource Source);
