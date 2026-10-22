using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Governance;

/// <summary>Returns an empty risk register when SQL storage is not active (in-memory test host).</summary>
public sealed class NoOpArchitectureRiskRegisterQuery : IArchitectureRiskRegisterQuery
{
    public Task<IReadOnlyList<ArchitectureRiskRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        int maxRows,
        ArchitectureRiskRegisterListOptions? options = null,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<ArchitectureRiskRegisterEntry>>([]);

    public Task<int> CountAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        ArchitectureRiskRegisterListOptions? options = null,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(0);
}
