using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Feasibility;

/// <inheritdoc cref="IDecisionIntakeTrailProvider" />
public sealed class NullDecisionIntakeTrailProvider : IDecisionIntakeTrailProvider
{
    public static NullDecisionIntakeTrailProvider Instance { get; } = new();

    /// <inheritdoc />
    public Task<TransparencyTrail?> TryGetTransparencyTrailAsync(Guid runId, CancellationToken cancellationToken) =>
        Task.FromResult<TransparencyTrail?>(null);
}
