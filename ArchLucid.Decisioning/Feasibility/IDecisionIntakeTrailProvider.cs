using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Feasibility;

/// <summary>
///     Resolves the Socratic intake <see cref="TransparencyTrail" /> for a run when the request
///     originated from draft intake (ADR 0048 / ADR 0050).
/// </summary>
public interface IDecisionIntakeTrailProvider
{
    /// <summary>
    ///     Returns the persisted intake trail for <paramref name="runId" />, or <see langword="null" />
    ///     when the run did not carry intake provenance.
    /// </summary>
    Task<TransparencyTrail?> TryGetTransparencyTrailAsync(Guid runId, CancellationToken cancellationToken);
}
