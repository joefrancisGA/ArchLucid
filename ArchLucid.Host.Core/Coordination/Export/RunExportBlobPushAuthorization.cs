using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Authorization;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Host.Core.Coordination.Export;

/// <summary>
/// Rechecks live directory and architecture access. A queued identity is a lookup key, not a reusable grant.
/// </summary>
public sealed class RunExportBlobPushAuthorization(
    IScimUserRepository users,
    IProjectRoleAssignmentRepository projectRoles,
    IRunRepository runs,
    IArchitectureShareAccessService shares) : IRunExportBlobPushAuthorization
{
    public async Task<Guid?> AuthorizeAsync(
        ScopeContext scope, Guid runId, string? actorKey, Guid? expectedDirectoryUserId, CancellationToken ct)
    {
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            runId == Guid.Empty || !TryGetDirectoryObjectId(actorKey, out string? directoryObjectId))
            return null;

        ScimUserRecord? user = await users.GetByExternalIdForAuthorizationAsync(
            scope.TenantId, directoryObjectId!, ct).ConfigureAwait(false);
        if (user is null || user.Id == Guid.Empty || user.TenantId != scope.TenantId ||
            !string.Equals(user.ExternalId, directoryObjectId, StringComparison.OrdinalIgnoreCase) || !user.Active ||
            user.DirectoryRemovedUtc is not null ||
            (expectedDirectoryUserId.HasValue && expectedDirectoryUserId.Value != user.Id))
            return null;

        // Only the server-side override used by RoleSyncService replaces tenant-token roles.
        bool tenantExecute = user.ResolvedRoleOrigin == ScimResolvedRoleOrigin.Manual &&
                             user.ResolvedRole is string role &&
                             TenantOrProjectCapabilityAuthorizationHandler.HasTenantExecuteRole(role.Trim());
        if (!tenantExecute && await projectRoles.GetHighestRoleAsync(
                scope.TenantId, scope.WorkspaceId, scope.ProjectId, user.Id, ct).ConfigureAwait(false) <
            ProjectScopedEffectiveRole.Operator)
            return null;

        // The including-archived method bypasses the run cache. An archived or mismatched row is still denied.
        RunRecord? run = await runs.GetByIdIncludingArchivedAsync(scope, runId, ct).ConfigureAwait(false);
        if (run is null || run.ArchivedUtc is not null || run.RunId != runId ||
            run.TenantId != scope.TenantId || run.WorkspaceId != scope.WorkspaceId ||
            run.ScopeProjectId != scope.ProjectId)
            return null;

        if (run.ArchitectureId is Guid architectureId)
        {
            ArchitectureShareAccessEvaluation access = await shares.EvaluateAsync(
                scope, architectureId, actorKey, true, true, false, ct).ConfigureAwait(false);
            if (!access.ArchitectureFound || !access.CanRead)
                return null;
        }

        return user.Id;
    }

    private static bool TryGetDirectoryObjectId(string? actorKey, out string? directoryObjectId)
    {
        directoryObjectId = null;
        if (actorKey is null || !actorKey.StartsWith(ActorContextKeys.JwtActorKeyPrefix, StringComparison.Ordinal))
            return false;

        string subject = actorKey[ActorContextKeys.JwtActorKeyPrefix.Length..];
        int separator = subject.IndexOf(':');
        string candidate = subject;
        if (separator >= 0)
        {
            if (!Guid.TryParseExact(subject[..separator], "D", out Guid domain) || domain == Guid.Empty)
                return false;
            candidate = subject[(separator + 1)..];
        }

        if (!Guid.TryParseExact(candidate, "D", out Guid objectId) || objectId == Guid.Empty)
            return false;

        directoryObjectId = candidate;
        return true;
    }
}
