using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Delta;

/// <summary>
///     Shared delta helper for connectors that slice the previous snapshot by <see cref="CanonicalObject.SourceType" />.
/// </summary>
public static class ConnectorDeltaAsyncHelper
{
    public static Task<ContextDelta> ComputeAsync(
        NormalizedContextBatch current,
        ContextSnapshot? previous,
        string sourceType,
        Func<CanonicalObject, string> stableKeySelector,
        IConnectorDeltaComputer deltaComputer,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(current);
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceType);
        ArgumentNullException.ThrowIfNull(stableKeySelector);
        ArgumentNullException.ThrowIfNull(deltaComputer);

        IReadOnlyList<CanonicalObject> previousSlice = previous?.CanonicalObjects
            .Where(o => string.Equals(o.SourceType, sourceType, StringComparison.Ordinal))
            .ToList() ?? [];

        ContextDelta delta = deltaComputer.Compute(
            current.CanonicalObjects,
            previousSlice,
            stableKeySelector);

        return Task.FromResult(delta);
    }
}
