using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IPreFinalizeChecklistService
{
    Task<PreFinalizeChecklistResult> BuildAsync(string runId, CancellationToken cancellationToken = default);
}
