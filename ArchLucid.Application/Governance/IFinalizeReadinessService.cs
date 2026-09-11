using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IFinalizeReadinessService
{
    Task<FinalizeReadinessResult> BuildAsync(
        string runId,
        IReadOnlyList<string>? requestAcknowledgedAssumptionIds = null,
        CancellationToken cancellationToken = default);
}
