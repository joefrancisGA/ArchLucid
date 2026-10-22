using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <summary>Records run-level approve / reject / request-remediation (TB-112).</summary>
public interface IRunOperatorGovernanceDispositionService
{
    Task<RunOperatorGovernanceDispositionDto> RecordAsync(
        Guid runId,
        RecordRunOperatorGovernanceDispositionRequest request,
        ScopeContext scope,
        string actorUserId,
        bool hasCommitBlockingFailures,
        CancellationToken cancellationToken = default);
}
