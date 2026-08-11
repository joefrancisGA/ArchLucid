using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Optional HTTP idempotency for finalize/commit (via <see cref="ICommitRunIdempotencyCoordinator" />): tenant
///     scope, normalised run key, hashed <c>Idempotency-Key</c>, and a fingerprint of the commit body.
/// </summary>
public sealed record CommitRunIdempotencyState(
    Guid TenantId,
    Guid WorkspaceId,
    Guid ProjectId,
    string CanonicalRunKey,
    byte[] IdempotencyKeyHash,
    byte[] RequestFingerprint)
{
    /// <summary>
    ///     Builds state from a trimmed, non-empty <c>Idempotency-Key</c> whose length the caller already validated.
    /// </summary>
    /// <param name="scope">Current tenant scope; the idempotency row is keyed on it.</param>
    /// <param name="runId">Run id as it arrived on the route, normalised here for the storage key.</param>
    /// <param name="request">Commit body; a null body fingerprints as the default request.</param>
    /// <param name="trimmedIdempotencyKey">Caller-supplied key, already trimmed and length-checked.</param>
    public static CommitRunIdempotencyState Create(
        ScopeContext scope,
        string runId,
        CommitRunRequest? request,
        string trimmedIdempotencyKey)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(trimmedIdempotencyKey);

        return new CommitRunIdempotencyState(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ArchitectureRunRouteIds.NormalizeForScopeKey(runId),
            ArchitectureRunIdempotencyHashing.HashIdempotencyKey(trimmedIdempotencyKey),
            ArchitectureRunIdempotencyHashing.FingerprintCommitRequest(request));
    }
}
