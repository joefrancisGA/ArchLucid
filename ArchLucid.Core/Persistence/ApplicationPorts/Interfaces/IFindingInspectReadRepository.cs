using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Interfaces;

/// <summary>
///     Scoped SQL read for the operator finding inspector (single round-trip per lookup).
/// </summary>
public interface IFindingInspectReadRepository
{
    /// <summary>
    ///     Returns the inspector payload when a <see cref="Finding" /> exists in scope; otherwise
    ///     <see langword="null" />.
    /// </summary>
    /// <param name="options">
    ///     When <see langword="null" />, behaves as <see cref="FindingInspectReadOptions.Full" />.
    ///     Pass <see cref="FindingInspectReadOptions.MetadataOnly" /> to omit <c>PayloadJson</c> LOB for detail first paint.
    /// </param>
    Task<FindingInspectResponse?> GetInspectAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken ct,
        FindingInspectReadOptions? options = null);
}
