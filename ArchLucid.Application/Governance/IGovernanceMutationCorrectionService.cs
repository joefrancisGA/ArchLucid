using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <summary>Records append-only governance mutation corrections on the durable audit trail (LI-05).</summary>
public interface IGovernanceMutationCorrectionService
{
    Task<GovernanceMutationCorrectionRecordedDto> RecordAsync(
        RecordGovernanceMutationCorrectionRequest request,
        ScopeContext scope,
        string actorUserId,
        CancellationToken cancellationToken = default);
}
