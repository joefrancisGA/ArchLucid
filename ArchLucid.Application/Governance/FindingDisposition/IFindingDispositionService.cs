using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.FindingDisposition;

public interface IFindingDispositionService
{
    Task<FindingDispositionEventDto> RecordAsync(
        RecordFindingDispositionRequest request,
        ScopeContext scope,
        string reviewerUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FindingDispositionEventDto>> ListHistoryAsync(
        Guid tenantId,
        string findingId,
        CancellationToken cancellationToken = default);
}
