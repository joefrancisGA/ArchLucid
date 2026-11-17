
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Advisory;

/// <inheritdoc cref="IRecommendationRepository" />
public sealed class InMemoryRecommendationRepository : IRecommendationRepository
{
    private const int MaxEntries = 5_000;

    private readonly List<RecommendationRecord> _items = [];
    private readonly Lock _gate = new();

    /// <inheritdoc />
    public Task UpsertAsync(RecommendationRecord recommendation, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(recommendation);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            _items.RemoveAll(x =>
                x.RecommendationId == recommendation.RecommendationId && SameScope(x, recommendation));
            if (_items.Count >= MaxEntries)
                _items.RemoveAt(0);

            _items.Add(Copy(recommendation));
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<RecommendationRecord?> GetByIdAsync(ScopeContext scope, Guid recommendationId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            RecommendationRecord? stored = _items.FirstOrDefault(x =>
                x.RecommendationId == recommendationId && MatchesScope(x, scope));
            return Task.FromResult(stored is null ? null : Copy(stored));
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RecommendationRecord>> ListByRunAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<RecommendationRecord> result = _items
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId &&
                    x.RunId == runId)
                .OrderByDescending(x => x.PriorityScore)
                .ThenByDescending(x => x.CreatedUtc)
                .Take(500)
                .Select(Copy)
                .ToList();

            return Task.FromResult<IReadOnlyList<RecommendationRecord>>(result);
        }
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<RecommendationRecord>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        int take,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        int n = Math.Clamp(take <= 0 ? 50 : take, 1, 500);
        lock (_gate)
        {
            List<RecommendationRecord> result = _items
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.WorkspaceId == workspaceId &&
                    x.ProjectId == projectId &&
                    (status is null || x.Status == status))
                .OrderByDescending(x => x.LastUpdatedUtc)
                .Take(n)
                .Select(Copy)
                .ToList();

            return Task.FromResult<IReadOnlyList<RecommendationRecord>>(result);
        }
    }

    private static RecommendationRecord Copy(RecommendationRecord record) => new()
    {
        RecommendationId = record.RecommendationId,
        TenantId = record.TenantId,
        WorkspaceId = record.WorkspaceId,
        ProjectId = record.ProjectId,
        RunId = record.RunId,
        ComparedToRunId = record.ComparedToRunId,
        Title = record.Title,
        Category = record.Category,
        Rationale = record.Rationale,
        SuggestedAction = record.SuggestedAction,
        Urgency = record.Urgency,
        ExpectedImpact = record.ExpectedImpact,
        PriorityScore = record.PriorityScore,
        Status = record.Status,
        CreatedUtc = record.CreatedUtc,
        LastUpdatedUtc = record.LastUpdatedUtc,
        ReviewedByUserId = record.ReviewedByUserId,
        ReviewedByUserName = record.ReviewedByUserName,
        ReviewComment = record.ReviewComment,
        ResolutionRationale = record.ResolutionRationale,
        SupportingFindingIdsJson = record.SupportingFindingIdsJson,
        SupportingDecisionIdsJson = record.SupportingDecisionIdsJson,
        SupportingArtifactIdsJson = record.SupportingArtifactIdsJson,
        SourceEvidenceLinksJson = record.SourceEvidenceLinksJson,
    };

    private static bool MatchesScope(RecommendationRecord record, ScopeContext scope) =>
        record.TenantId == scope.TenantId &&
        record.WorkspaceId == scope.WorkspaceId &&
        record.ProjectId == scope.ProjectId;

    private static bool SameScope(RecommendationRecord stored, RecommendationRecord incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;
}
