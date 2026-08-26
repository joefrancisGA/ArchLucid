using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Continue-from-existing closed-loop flights, kept off the review-cache key space.
/// </summary>
internal sealed class ClosedLoopContinueRunSingleFlight
{
    private readonly ReviewSingleFlightCoordinator _coordinator = new();

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

        string key = string.Join(
            '|',
            "continue",
            tenantId,
            runId,
            requestManifest.ContentHash ?? string.Empty,
            publishToProduct ? "publish=1" : "publish=0");

        return _coordinator.CoalesceAsync(key, leaderWork, cancellationToken);
    }
}
