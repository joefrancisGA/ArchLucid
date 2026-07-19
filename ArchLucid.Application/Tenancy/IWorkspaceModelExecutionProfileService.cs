using ArchLucid.Core.Agents;

namespace ArchLucid.Application.Tenancy;

public interface IWorkspaceModelExecutionProfileService
{
    Task<WorkspaceModelExecutionProfileSnapshot> GetAsync(CancellationToken cancellationToken);

    Task<WorkspaceModelExecutionProfileSnapshot> SetAsync(
        AgentModelExecutionProfile profile,
        CancellationToken cancellationToken);

    Task<WorkspaceModelExecutionProfileSnapshot> ClearOverrideAsync(CancellationToken cancellationToken);
}
