using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed partial class LegacyPlatformIdentityMigrationService
{
    private async Task<bool> TryCreateMembershipAsync(
        WorkspaceMembershipInsert insert,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> existingMemberships =
            await _memberships.ListByUserAndTenantAsync(insert.UserId, insert.TenantId, cancellationToken)
                .ConfigureAwait(false);

        if (existingMemberships.Any(row => row.WorkspaceId == insert.WorkspaceId))
        {
            return false;
        }

        await _memberships.UpsertAsync(insert, updatedUtc, cancellationToken).ConfigureAwait(false);

        return true;
    }

    private async Task RecordReviewAsync(
        string legacySourceType,
        Guid legacySourceId,
        Guid? tenantId,
        IdentityMigrationReviewReason reasonCode,
        string reasonDetail,
        CancellationToken cancellationToken)
    {
        await _reviewItems.UpsertAsync(
            legacySourceType,
            legacySourceId,
            tenantId,
            reasonCode,
            reasonDetail,
            _timeProvider.GetUtcNow(),
            cancellationToken).ConfigureAwait(false);
    }

    private static string MapProjectRole(string role) =>
        role switch
        {
            "ProjectAdmin" => ArchLucidRoles.Admin,
            "Operator" => ArchLucidRoles.Operator,
            _ => ArchLucidRoles.Reader
        };

    private static string MapScimResolvedRole(string? resolvedRole)
    {
        if (string.IsNullOrWhiteSpace(resolvedRole))
        {
            return ArchLucidRoles.Reader;
        }

        return resolvedRole.Trim();
    }
}
