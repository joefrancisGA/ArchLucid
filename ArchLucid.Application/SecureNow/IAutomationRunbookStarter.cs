namespace ArchLucid.Application.SecureNow;

public interface IAutomationRunbookStarter
{
    Task<bool> StartAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        string actor,
        CancellationToken cancellationToken = default);
}
