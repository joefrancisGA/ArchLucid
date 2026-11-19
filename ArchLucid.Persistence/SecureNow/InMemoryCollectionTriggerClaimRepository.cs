using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.SecureNow;

/// <summary>
/// Process-local claim store so InMemory storage registers the same
/// <see cref="ICollectionTriggerClaimRepository"/> as Sql.
/// </summary>
public sealed class InMemoryCollectionTriggerClaimRepository(ICollectionRunRepository collectionRuns) : ICollectionTriggerClaimRepository
{
    private readonly ConcurrentDictionary<string, ClaimRecord> _claims = new(StringComparer.Ordinal);

    public Task<(bool Acquired, Guid RunId, byte State)> TryReserveAsync(
        ProjectScopeKey scope,
        string idempotencyKey,
        Guid proposedRunId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);

        string key = idempotencyKey.Trim();

        if (key.Length > 256)
        {
            throw new ArgumentOutOfRangeException(nameof(idempotencyKey), "Idempotency key exceeds 256 characters.");
        }

        if (proposedRunId == Guid.Empty)
        {
            throw new ArgumentException("A nonempty run ID is required.", nameof(proposedRunId));
        }

        cancellationToken.ThrowIfCancellationRequested();

        ClaimRecord created = new() { RunId = proposedRunId, State = 0 };
        ClaimRecord stored = _claims.GetOrAdd(ClaimKey(scope, key), created);
        bool acquired = ReferenceEquals(stored, created);
        return Task.FromResult((acquired, stored.RunId, stored.State));
    }

    public async Task<bool> ReconcilePersistedRunAsync(
        ProjectScopeKey scope,
        string idempotencyKey,
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(idempotencyKey);

        if (runId == Guid.Empty)
        {
            throw new ArgumentException("Run ID is required.", nameof(runId));
        }

        cancellationToken.ThrowIfCancellationRequested();

        string key = ClaimKey(scope, idempotencyKey.Trim());
        if (!_claims.TryGetValue(key, out ClaimRecord? claim))
        {
            return false;
        }

        if (claim.RunId != runId || claim.State != 0)
        {
            return false;
        }

        ScopeContext runScope = new() { TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId };
        if (await collectionRuns.GetAsync(runScope, runId, cancellationToken) is null)
        {
            return false;
        }

        return _claims.TryUpdate(key, claim with { State = 1 }, claim);
    }

    private static string ClaimKey(ProjectScopeKey scope, string idempotencyKey) =>
        $"{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{idempotencyKey}";

    private sealed record ClaimRecord
    {
        public required Guid RunId { get; init; }

        public byte State { get; init; }
    }
}
