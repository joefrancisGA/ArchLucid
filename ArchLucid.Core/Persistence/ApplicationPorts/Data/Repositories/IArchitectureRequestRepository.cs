using System.Data;

using ArchLucid.Contracts.Requests;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Persistence contract for <see cref="ArchitectureRequest" /> records.
/// </summary>
public interface IArchitectureRequestRepository
{
    /// <summary>
    ///     Persists a new architecture request.
    ///     <paramref name="request" /> must have a non-empty <c>RequestId</c>.
    /// </summary>
    Task CreateAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    /// <summary>
    ///     Returns the architecture request with the specified <paramref name="requestId" />,
    ///     or <see langword="null" /> when not found.
    /// </summary>
    Task<ArchitectureRequest?> GetByIdAsync(string requestId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Batch lookup for list paths that would otherwise N× <see cref="GetByIdAsync" />.
    ///     Missing ids are omitted from the result dictionary.
    /// </summary>
    Task<IReadOnlyDictionary<string, ArchitectureRequest>> ListByIdsAsync(
        IReadOnlyCollection<string> requestIds,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Marks the request as archived.
    /// </summary>
    Task ArchiveAsync(string requestId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Restores an archived request (clears <see cref="ArchitectureRequest.IsArchived" />).
    /// </summary>
    Task RestoreAsync(string requestId, CancellationToken cancellationToken = default);

    /// <summary>Replaces the stored JSON payload for an existing architecture request.</summary>
    Task<bool> ReplaceAsync(ArchitectureRequest request, CancellationToken cancellationToken = default);
}
