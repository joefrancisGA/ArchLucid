using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Thread-safe in-memory <see cref="ICoverageAssignmentRepository" /> for tests and no-SQL local runs.</summary>
public sealed class InMemoryCoverageAssignmentRepository : ICoverageAssignmentRepository
{
    private readonly Lock _gate = new();
    private readonly List<CoverageAssignment> _items = [];

    public Task AddAsync(CoverageAssignment assignment, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(assignment);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            _items.Add(Clone(assignment));
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<CoverageAssignment>> ListByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            List<CoverageAssignment> list = _items
                .Where(row => string.Equals(row.RunId, runId, StringComparison.Ordinal))
                .OrderBy(row => row.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<CoverageAssignment>>(list);
        }
    }

    public Task<IReadOnlyList<CoverageAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            List<CoverageAssignment> list = _items
                .Where(row => row.TenantId == tenantId
                              && row.WorkspaceId == workspaceId
                              && row.ProjectId == projectId
                              && row.RunId is null)
                .OrderBy(row => row.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<CoverageAssignment>>(list);
        }
    }

    private static CoverageAssignment Clone(CoverageAssignment source) => new()
    {
        CoverageAssignmentId = source.CoverageAssignmentId,
        TenantId = source.TenantId,
        WorkspaceId = source.WorkspaceId,
        ProjectId = source.ProjectId,
        RunId = source.RunId,
        PolicyPackId = source.PolicyPackId,
        PolicyPackVersion = source.PolicyPackVersion,
        CoverageType = source.CoverageType,
        SelectionState = source.SelectionState,
        RecommendationConfidence = source.RecommendationConfidence,
        RecommendationTrigger = source.RecommendationTrigger,
        RecommendationRationale = source.RecommendationRationale,
        TriggeringEvidenceRef = source.TriggeringEvidenceRef,
        ExclusionReason = source.ExclusionReason,
        ActorUserId = source.ActorUserId,
        CreatedUtc = source.CreatedUtc,
        EvaluationVersion = source.EvaluationVersion,
    };
}
