using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Append-only persistence for <see cref="CoverageAssignment" /> rows.</summary>
public interface ICoverageAssignmentRepository
{
    Task AddAsync(CoverageAssignment assignment, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CoverageAssignment>> ListByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CoverageAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default);
}
