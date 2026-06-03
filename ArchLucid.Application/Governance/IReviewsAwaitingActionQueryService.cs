using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

/// <summary>Lists executed-but-uncommitted recurrence runs (TB-263).</summary>
public interface IReviewsAwaitingActionQueryService
{
    Task<GovernanceReviewsAwaitingActionResponse> ListAsync(
        ScopeContext scope,
        CancellationToken cancellationToken);
}
