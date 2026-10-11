namespace ArchLucid.Application.SecureNow;

public sealed class UnavailableAutomationRunbookStarter : IAutomationRunbookStarter
{
    public Task<bool> StartAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        string actor,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}
