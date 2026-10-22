using System.Data;

using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence port for <see cref="PolicyPackVersion" /> rows.</summary>
public interface IPolicyPackVersionRepository
{
    Task CreateAsync(
        PolicyPackVersion version,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task UpdateAsync(PolicyPackVersion version, CancellationToken ct);

    Task<PolicyPackVersion?> GetByPackAndVersionAsync(
        Guid policyPackId,
        string version,
        CancellationToken ct);

    Task<(PolicyPackVersion Version, string? PreviousContentJson)> UpsertPublishedVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct);

    /// <summary>
    ///     Lists version metadata for a pack (newest first). Implementations omit <c>ContentJson</c>
    ///     (empty string); use <see cref="GetByPackAndVersionAsync" /> for the full body.
    /// </summary>
    Task<IReadOnlyList<PolicyPackVersion>> ListByPackAsync(
        Guid policyPackId,
        CancellationToken ct);
}
