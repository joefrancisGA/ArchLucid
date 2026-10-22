namespace ArchLucid.Application.Tenancy;

public interface IWorkspaceAllowedEngineSetService
{
    Task<WorkspaceAllowedEngineSetSnapshot> GetAsync(CancellationToken cancellationToken);

    Task<WorkspaceAllowedEngineSetSnapshot> SetAsync(
        WorkspaceAllowedEngineSetSnapshot snapshot,
        CancellationToken cancellationToken);

    Task<WorkspaceAllowedEngineSetSnapshot> ClearOverrideAsync(CancellationToken cancellationToken);

    bool IsAliasAllowed(WorkspaceAllowedEngineSetSnapshot snapshot, string aliasId);
}
