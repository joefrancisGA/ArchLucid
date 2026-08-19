using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Delta;

/// <summary>
///     Computes a structured <see cref="ContextDelta" /> for one connector by comparing the current
///     normalized batch against the filtered previous objects using a caller-supplied stable key selector.
/// </summary>
/// <remarks>
///     Callers filter <c>previousSnapshot.CanonicalObjects</c> to their own <c>SourceType</c> slice before
///     invoking this interface, keeping each connector responsible for its own boundary.
/// </remarks>
public interface IConnectorDeltaComputer
{
    ContextDelta Compute(
        IReadOnlyList<CanonicalObject> current,
        IReadOnlyList<CanonicalObject> previous,
        Func<CanonicalObject, string> stableKeySelector);
}
