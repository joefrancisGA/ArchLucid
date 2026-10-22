using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Coverage;

/// <summary>Read-only coverage resolution for runs and tenant scope.</summary>
public interface ICoverageQueryService
{
    Task<CoverageSummary> GetByRunIdAsync(ScopeContext scope, Guid runId, CancellationToken cancellationToken = default);

    Task<CoverageSummary> GetByScopeAsync(ScopeContext scope, CancellationToken cancellationToken = default);
}
