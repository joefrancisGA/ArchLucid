using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Governance;

/// <summary>Returns an empty risk register when SQL storage is not active (in-memory test host).</summary>
public sealed class NoOpArchitectureRiskRegisterQuery : IArchitectureRiskRegisterQuery
{
    public Task<IReadOnlyList<ArchitectureRiskRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<ArchitectureRiskRegisterEntry>>([]);
}
