using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Publishes gated ArchitectureIntelligence product DTOs into existing findings/advisory stores.
/// </summary>
public sealed class ArchitectureIntelligenceProductPublishService : IArchitectureIntelligenceProductPublishService
{
    private readonly IFindingsSnapshotRepository? _findingsSnapshotRepository;
    private readonly IRecommendationRepository? _recommendationRepository;
    private readonly IRunRepository? _runRepository;

    public ArchitectureIntelligenceProductPublishService(IServiceProvider serviceProvider)
    {
        ArgumentNullException.ThrowIfNull(serviceProvider);
        _findingsSnapshotRepository = serviceProvider.GetService<IFindingsSnapshotRepository>();
        _recommendationRepository = serviceProvider.GetService<IRecommendationRepository>();
        _runRepository = serviceProvider.GetService<IRunRepository>();
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
        ScopeContext scope = BuildScope(tenantId, workspaceId, projectId);
        Guid? findingsSnapshotId = null;
        int recommendationCount = 0;

        if (_findingsSnapshotRepository is not null && result.ProductFindings.Count > 0)
        {
            findingsSnapshotId = await MergeOrCreateFindingsSnapshotAsync(
                scope,
                runGuid,
                result.ProductFindings,
                cancellationToken).ConfigureAwait(false);
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

    private async Task<Guid?> MergeOrCreateFindingsSnapshotAsync(
        ScopeContext scope,
        Guid runGuid,
        IReadOnlyList<Finding> productFindings,
        CancellationToken cancellationToken)
    {
        FindingsSnapshot? snapshot = null;

        if (_runRepository is not null)
        {
            ArchLucid.Persistence.Models.RunRecord? run = await _runRepository
                .GetByIdAsync(scope, runGuid, cancellationToken)
                .ConfigureAwait(false);

            if (run?.FindingsSnapshotId is Guid existingSnapshotId)
            {
                snapshot = await _findingsSnapshotRepository!
                    .GetByIdAsync(scope, existingSnapshotId, cancellationToken)
                    .ConfigureAwait(false);
            }

            if (snapshot is null)
            {
                snapshot = new FindingsSnapshot
                {
                    FindingsSnapshotId = Guid.NewGuid(),
                    RunId = runGuid,
                    CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                    Findings = [],
                };
            }

            FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
                snapshot,
                productFindings,
                TimeProvider.System);

            await _findingsSnapshotRepository!.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);

            if (run is not null && run.FindingsSnapshotId != snapshot.FindingsSnapshotId)
            {
                run.FindingsSnapshotId = snapshot.FindingsSnapshotId;
                await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
            }

            return snapshot.FindingsSnapshotId;
        }

        snapshot = new FindingsSnapshot
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = runGuid,
            CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            Findings = [],
        };

        FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
            snapshot,
            productFindings,
            TimeProvider.System);

        await _findingsSnapshotRepository!.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);

        return snapshot.FindingsSnapshotId;
    }

    private static ScopeContext BuildScope(string tenantId, string workspaceId, string projectId)
    {
        return new ScopeContext
        {
            TenantId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(tenantId),
            WorkspaceId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(workspaceId),
            ProjectId = ArchitectureIntelligenceTenantIdMapper.ToStorageGuid(projectId),
        };
    }
}
