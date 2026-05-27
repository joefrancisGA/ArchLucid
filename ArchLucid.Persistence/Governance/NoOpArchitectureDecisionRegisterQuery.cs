using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Governance;

/// <summary>Returns an empty decision register when SQL storage is not active (in-memory test host).</summary>
public sealed class NoOpArchitectureDecisionRegisterQuery : IArchitectureDecisionRegisterQuery
{
    public Task<IReadOnlyList<ArchitectureDecisionRegisterEntry>> ListAsync(
        Guid tenantId,
        Guid? projectId,
        int maxRows,
        CancellationToken cancellationToken) =>
        Task.FromResult<IReadOnlyList<ArchitectureDecisionRegisterEntry>>([]);
}
