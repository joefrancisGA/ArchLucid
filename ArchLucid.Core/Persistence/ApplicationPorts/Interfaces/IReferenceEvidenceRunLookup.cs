using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Interfaces;

/// <summary>
///     Lists recent committed runs for a tenant so an admin can pick the latest non-demo (or demo when allowed)
///     reference-evidence anchor run.
/// </summary>
public interface IReferenceEvidenceRunLookup
{
    /// <summary>
    ///     Returns up to <paramref name="take" /> committed runs for <paramref name="tenantId" />, newest first
    ///     (<c>CreatedUtc DESC, RunId ASC</c>). When <paramref name="includeDemo" /> is <see langword="false" />, demo,
    ///     sample, and showcase seed runs are excluded at the data layer.
    /// </summary>
    Task<IReadOnlyList<ReferenceEvidenceRunCandidate>> ListRecentCommittedRunsAsync(
        Guid tenantId,
        int take,
        bool includeDemo,
        CancellationToken cancellationToken = default);
}
