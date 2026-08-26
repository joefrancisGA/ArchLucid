using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Continue-from-existing closed-loop flights, kept off the review-cache key space.
/// </summary>
public sealed class ClosedLoopContinueRunSingleFlight
{
    private readonly ReviewSingleFlightCoordinator _coordinator = new();

    public static string BuildCoalesceKey(
        string tenantId,
        string runId,
        ReviewCacheDependencyManifest requestManifest,
        bool publishToProduct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(requestManifest);

        string normalizedTenantId = ClosedLoopTenantIdNormalizer.NormalizeRequired(tenantId);
        string normalizedRunId = ClosedLoopRunIdNormalizer.NormalizeRequired(runId);

        return string.Join(
            '|',
            "continue",
            normalizedTenantId,
            normalizedRunId,
            requestManifest.ContentHash ?? string.Empty,
            publishToProduct ? "publish=1" : "publish=0");
    }

    public Task<ClosedLoopReasoningResult> CoalesceAsync(
        string tenantId,
        string runId,
        ReviewCacheDependencyManifest requestManifest,
        bool publishToProduct,
        Func<CancellationToken, Task<ClosedLoopReasoningResult>> leaderWork,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tenantId);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(requestManifest);
        ArgumentNullException.ThrowIfNull(leaderWork);

        string key = BuildCoalesceKey(tenantId, runId, requestManifest, publishToProduct);

        return _coordinator.CoalesceAsync(
            key,
            leaderWork,
            cancellationToken,
            stripCoalescedFollowerPublishLeaks: !publishToProduct);
    }
}
