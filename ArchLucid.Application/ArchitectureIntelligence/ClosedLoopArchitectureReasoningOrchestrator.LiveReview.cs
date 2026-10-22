using ArchLucid.Application.ArchitectureIntelligence.Stages;
using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ClosedLoopArchitectureReasoningOrchestrator
{
    private async Task<ClosedLoopReasoningResult> ExecuteLiveReviewAsync(
        ClosedLoopReasoningRequest effectiveRequest,
        string tenantId,
        string runId,
        ArchitectureIntelligenceBudgetDecision budget,
        ReviewCacheDependencyManifest? cacheManifest,
        ReviewCacheStorageKind? storageKind,
        CancellationToken cancellationToken)
    {
        ClosedLoopStageContext context = new()
        {
            EffectiveRequest = effectiveRequest,
            TenantId = tenantId,
            RunId = runId,
            Budget = budget,
            CacheManifest = cacheManifest,
            StorageKind = storageKind,
        };

        await _extractionStage.ExecuteAsync(context, cancellationToken);
        await _interviewStage.ExecuteAsync(context, cancellationToken);
        await _reviewStage.ExecuteAsync(context, cancellationToken);
        await _recommendationStage.ExecuteAsync(context, cancellationToken);

        return await _publishStage.ExecuteAsync(context, cancellationToken);
    }

    private static string RequireTenantId(ClosedLoopReasoningRequest request)
    {
        string tenantId = ClosedLoopTenantIdNormalizer.NormalizeRequired(request.TenantId ?? string.Empty);

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(request));
        }

        return tenantId;
    }
}
