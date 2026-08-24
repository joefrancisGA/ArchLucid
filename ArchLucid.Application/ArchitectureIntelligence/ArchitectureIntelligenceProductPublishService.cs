using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Services;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Publishes gated ArchitectureIntelligence product DTOs into existing findings/advisory stores.
/// </summary>
public sealed class ArchitectureIntelligenceProductPublishService : IArchitectureIntelligenceProductPublishService
{
    private readonly IFindingsSnapshotRepository? _findingsSnapshotRepository;
    private readonly IRecommendationRepository? _recommendationRepository;

    public ArchitectureIntelligenceProductPublishService(IServiceProvider serviceProvider)
    {
        ArgumentNullException.ThrowIfNull(serviceProvider);
        _findingsSnapshotRepository = serviceProvider.GetService<IFindingsSnapshotRepository>();
        _recommendationRepository = serviceProvider.GetService<IRecommendationRepository>();
    }

    public async Task<ArchitectureIntelligencePublishResult> PublishAsync(
        ClosedLoopReasoningResult result,
        string tenantId,
        string workspaceId,
        string projectId,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (string.IsNullOrWhiteSpace(tenantId)
            || string.IsNullOrWhiteSpace(workspaceId)
            || string.IsNullOrWhiteSpace(projectId)
            || string.IsNullOrWhiteSpace(runId))
        {
            return new ArchitectureIntelligencePublishResult
            {
                Published = false,
                SkipReason = "TenantId, WorkspaceId, ProjectId, and RunId are required to publish.",
            };
        }

        if (result.PublishBlocked)
        {
            return new ArchitectureIntelligencePublishResult
            {
                Published = false,
                SkipReason = "Publish blocked by trust gate.",
            };
        }

        if (_findingsSnapshotRepository is null && _recommendationRepository is null)
        {
            return new ArchitectureIntelligencePublishResult
            {
                Published = false,
                SkipReason = "Product repositories are not registered in this host.",
            };
        }

        Guid runGuid = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(runId);
        Guid? findingsSnapshotId = null;
        int recommendationCount = 0;

        if (_findingsSnapshotRepository is not null && result.ProductFindings.Count > 0)
        {
            FindingsSnapshot snapshot = new()
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = runGuid,
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                Findings = [],
            };

            FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
                snapshot,
                result.ProductFindings,
                TimeProvider.System);

            await _findingsSnapshotRepository.SaveAsync(snapshot, cancellationToken);
            findingsSnapshotId = snapshot.FindingsSnapshotId;
        }

        if (_recommendationRepository is not null)
        {
            foreach (var recommendation in result.ProductRecommendations)
            {
                await _recommendationRepository.UpsertAsync(recommendation, cancellationToken);
                recommendationCount++;
            }
        }

        return new ArchitectureIntelligencePublishResult
        {
            Published = findingsSnapshotId.HasValue || recommendationCount > 0,
            FindingsSnapshotId = findingsSnapshotId,
            RecommendationCount = recommendationCount,
            SkipReason = findingsSnapshotId is null && recommendationCount == 0
                ? "No publishable findings or recommendations."
                : null,
        };
    }
}
