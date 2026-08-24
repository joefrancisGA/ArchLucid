using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Drafts;

/// <summary>Draft-scoped create-run idempotency for submit (operator-safe retry).</summary>
public static class DraftSubmitIdempotency
{
    /// <summary>Builds idempotency state keyed by <c>draft-submit:{draftId:N}</c>.</summary>
    public static CreateRunIdempotencyState Build(ScopeContext scope, Guid draftId, ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        string key = $"draft-submit:{draftId:N}";

        return new CreateRunIdempotencyState(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ArchitectureRunIdempotencyHashing.HashIdempotencyKey(key),
            ArchitectureRunIdempotencyHashing.FingerprintRequest(request));
    }
}
