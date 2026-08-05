using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Interfaces;

/// <summary>
///     Optional projection flags for <see cref="IFindingInspectReadRepository.GetInspectAsync" />.
/// </summary>
public sealed class FindingInspectReadOptions
{
    /// <summary>
    ///     When <see langword="false" />, omits relational <c>PayloadJson</c> (and may project title/rationale only).
    ///     Default <see langword="true" /> preserves full typed payload for inspect / ITSM / Ask callers.
    /// </summary>
    public bool IncludeTypedPayload { get; init; } = true;

    /// <summary>Full typed payload (default).</summary>
    public static FindingInspectReadOptions Full { get; } = new() { IncludeTypedPayload = true };

    /// <summary>Metadata-first path for finding detail first paint (TB-931).</summary>
    public static FindingInspectReadOptions MetadataOnly { get; } = new() { IncludeTypedPayload = false };
}
