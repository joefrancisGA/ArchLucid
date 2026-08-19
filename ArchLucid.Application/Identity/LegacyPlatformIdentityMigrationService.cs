using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public interface ILegacyPlatformIdentityMigrationService
{
    Task<IdentityMigrationReport> MigrateAsync(CancellationToken cancellationToken);
}

public sealed class LegacyPlatformIdentityMigrationService(
    ILegacyPlatformIdentityMigrationSource legacySource,
    IPlatformIdentityService platformIdentity,
    IWorkspaceMembershipRepository memberships,
    IIdentityMigrationReviewRepository reviewItems,
    TimeProvider timeProvider) : ILegacyPlatformIdentityMigrationService
{
    private const string ScimLegacySourceType = "ScimUser";

    private const string TrialLegacySourceType = "IdentityUser";

    private readonly ILegacyPlatformIdentityMigrationSource _legacySource =
        legacySource ?? throw new ArgumentNullException(nameof(legacySource));

    private readonly IPlatformIdentityService _platformIdentity =
        platformIdentity ?? throw new ArgumentNullException(nameof(platformIdentity));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly IIdentityMigrationReviewRepository _reviewItems =
        reviewItems ?? throw new ArgumentNullException(nameof(reviewItems));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<IdentityMigrationReport> MigrateAsync(CancellationToken cancellationToken)
    {
        int platformUsersCreated = 0;
        int identitiesCreated = 0;
        int membershipsCreated = 0;
        int reviewItemsCreated = 0;

        Dictionary<Guid, Guid> scimToPlatformUser = [];

        IReadOnlyList<LegacyScimUserMigrationRow> scimUsers =
            await _legacySource.ListScimUsersAsync(cancellationToken).ConfigureAwait(false);

        foreach (LegacyScimUserMigrationRow scimUser in scimUsers)
        {
            if (scimUser.PlatformUserId is Guid existingPlatformUserId)
            {
                scimToPlatformUser[scimUser.ScimUserId] = existingPlatformUserId;

                continue;
            }

            (ExternalIdentityKey externalKey, bool reviewRecorded) =
                await BuildScimExternalKeyAsync(scimUser, cancellationToken).ConfigureAwait(false);

            if (reviewRecorded)
            {
                reviewItemsCreated++;
            }

            PlatformUserRecord? existingUser =
                await _platformIdentity.FindUserByExternalIdentityAsync(externalKey, cancellationToken)
                    .ConfigureAwait(false);

            if (existingUser is not null)
            {
                await RecordReviewAsync(
                        ScimLegacySourceType,
                        scimUser.ScimUserId,
                        scimUser.TenantId,
                        IdentityMigrationReviewReason.DuplicateExternalIdentity,
                        "SCIM user external identity already maps to a platform user.",
                        cancellationToken)
                    .ConfigureAwait(false);

                reviewItemsCreated++;

                continue;
            }

            string? primaryContactEmail = null;

            if (IdentityEmailNormalizer.TryNormalize(scimUser.UserName, out _, out string contactDisplay))
            {
                primaryContactEmail = contactDisplay;
            }

            PlatformUserRecord createdUser = await _platformIdentity.CreateUserFromVerifiedIdentityAsync(
                new VerifiedExternalIdentityCreateRequest
                {
                    ExternalKey = externalKey,
                    PrimaryContactEmail = primaryContactEmail,
                    EmailVerified = false,
                    DisplayName = scimUser.DisplayName ?? scimUser.UserName,
                    ActorId = "system:identity-migration",
                    TenantIdForAudit = scimUser.TenantId
                },
                cancellationToken).ConfigureAwait(false);

            platformUsersCreated++;
            identitiesCreated++;

            await _legacySource.LinkScimUserAsync(scimUser.ScimUserId, createdUser.Id, cancellationToken)
                .ConfigureAwait(false);

            scimToPlatformUser[scimUser.ScimUserId] = createdUser.Id;
        }

        IReadOnlyList<LegacyTrialIdentityMigrationRow> trialUsers =
            await _legacySource.ListTrialIdentityUsersAsync(cancellationToken).ConfigureAwait(false);

        foreach (LegacyTrialIdentityMigrationRow trialUser in trialUsers)
        {
            if (trialUser.PlatformUserId is Guid existingPlatformUserId)
            {
                continue;
            }

            ExternalIdentityKey trialKey = new()
            {
                ProviderType = AuthenticationProviderType.TrialLocalPassword,
                NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.TrialLocalPassword),
                Subject = trialUser.IdentityUserId.ToString("D")
            };

            PlatformUserRecord? existingTrialIdentityUser =
                await _platformIdentity.FindUserByExternalIdentityAsync(trialKey, cancellationToken)
                    .ConfigureAwait(false);

            if (existingTrialIdentityUser is not null)
            {
                await RecordReviewAsync(
                        TrialLegacySourceType,
                        trialUser.IdentityUserId,
                        null,
                        IdentityMigrationReviewReason.DuplicateExternalIdentity,
                        "Trial identity external key already maps to a platform user.",
                        cancellationToken)
                    .ConfigureAwait(false);

                reviewItemsCreated++;

                continue;
            }

            bool emailVerified = trialUser.EmailConfirmed && trialUser.EmailVerifiedUtc is not null;

            PlatformUserRecord createdUser = await _platformIdentity.CreateUserFromVerifiedIdentityAsync(
                new VerifiedExternalIdentityCreateRequest
                {
                    ExternalKey = trialKey,
                    DisplayEmail = emailVerified ? trialUser.Email : null,
                    EmailVerified = emailVerified,
                    DisplayName = trialUser.Email,
                    ActorId = "system:identity-migration"
                },
                cancellationToken).ConfigureAwait(false);

            platformUsersCreated++;
            identitiesCreated++;

            await _legacySource.LinkTrialIdentityUserAsync(trialUser.IdentityUserId, createdUser.Id, cancellationToken)
                .ConfigureAwait(false);

            if (!string.IsNullOrWhiteSpace(trialUser.LinkedEntraOid))
            {
                await RecordReviewAsync(
                        TrialLegacySourceType,
                        trialUser.IdentityUserId,
                        null,
                        IdentityMigrationReviewReason.LinkedEntraOidConflict,
                        "Linked Entra OID present on trial user; tenant-scoped Microsoft identity attach requires manual review.",
                        cancellationToken)
                    .ConfigureAwait(false);

                reviewItemsCreated++;
            }
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();

        IReadOnlyList<LegacyProjectRoleAssignmentMigrationRow> projectRoles =
            await _legacySource.ListProjectRoleAssignmentsAsync(cancellationToken).ConfigureAwait(false);

        HashSet<(Guid UserId, Guid WorkspaceId)> membershipKeys = [];

        foreach (LegacyProjectRoleAssignmentMigrationRow assignment in projectRoles)
        {
            if (!scimToPlatformUser.TryGetValue(assignment.ScimUserId, out Guid platformUserId))
            {
                continue;
            }

            (Guid UserId, Guid WorkspaceId) key = (platformUserId, assignment.WorkspaceId);

            if (!membershipKeys.Add(key))
            {
                continue;
            }

            if (!await TryCreateMembershipAsync(
                    new WorkspaceMembershipInsert
                    {
                        UserId = platformUserId,
                        TenantId = assignment.TenantId,
                        WorkspaceId = assignment.WorkspaceId,
                        Role = MapProjectRole(assignment.Role),
                        Status = WorkspaceMembershipStatus.Active
                    },
                    now,
                    cancellationToken)
                .ConfigureAwait(false))
            {
                continue;
            }

            membershipsCreated++;
        }

        foreach (LegacyScimUserMigrationRow scimUser in scimUsers)
        {
            if (!scimToPlatformUser.TryGetValue(scimUser.ScimUserId, out Guid platformUserId))
            {
                continue;
            }

            bool hasMembership = projectRoles.Any(row => row.ScimUserId == scimUser.ScimUserId);

            if (hasMembership)
            {
                continue;
            }

            Guid? defaultWorkspaceId =
                await _legacySource.TryGetDefaultWorkspaceIdAsync(scimUser.TenantId, cancellationToken)
                    .ConfigureAwait(false);

            if (defaultWorkspaceId is null)
            {
                await RecordReviewAsync(
                        ScimLegacySourceType,
                        scimUser.ScimUserId,
                        scimUser.TenantId,
                        IdentityMigrationReviewReason.MissingDefaultWorkspace,
                        "SCIM user has no project role assignment and tenant default workspace could not be resolved.",
                        cancellationToken)
                    .ConfigureAwait(false);

                reviewItemsCreated++;

                continue;
            }

            (Guid UserId, Guid WorkspaceId) key = (platformUserId, defaultWorkspaceId.Value);

            if (!membershipKeys.Add(key))
            {
                continue;
            }

            if (!await TryCreateMembershipAsync(
                    new WorkspaceMembershipInsert
                    {
                        UserId = platformUserId,
                        TenantId = scimUser.TenantId,
                        WorkspaceId = defaultWorkspaceId.Value,
                        Role = MapScimResolvedRole(scimUser.ResolvedRole),
                        Status = scimUser.Active
                            ? WorkspaceMembershipStatus.Active
                            : WorkspaceMembershipStatus.Suspended
                    },
                    now,
                    cancellationToken)
                .ConfigureAwait(false))
            {
                continue;
            }

            membershipsCreated++;
        }

        IReadOnlyList<IdentityMigrationReviewItemRecord> unresolved =
            await _reviewItems.ListUnresolvedAsync(cancellationToken).ConfigureAwait(false);

        return new IdentityMigrationReport
        {
            PlatformUsersCreated = platformUsersCreated,
            AuthenticationIdentitiesCreated = identitiesCreated,
            WorkspaceMembershipsCreated = membershipsCreated,
            ReviewItemsCreated = reviewItemsCreated,
            ReviewItems = unresolved
        };
    }

    private async Task<(ExternalIdentityKey Key, bool ReviewItemRecorded)> BuildScimExternalKeyAsync(
        LegacyScimUserMigrationRow scimUser,
        CancellationToken cancellationToken)
    {
        string? entraTenantId =
            await _legacySource.TryGetEntraTenantIdAsync(scimUser.TenantId, cancellationToken).ConfigureAwait(false);

        string normalizedIssuer;
        bool reviewItemRecorded = false;

        if (!string.IsNullOrWhiteSpace(entraTenantId) && Guid.TryParse(entraTenantId.Trim(), out Guid parsedEntraTenantId))
        {
            normalizedIssuer = IdentityIssuerNormalizer.NormalizeMicrosoftEntraIssuer(parsedEntraTenantId);
        }
        else
        {
            normalizedIssuer = IdentityIssuerNormalizer.Normalize($"archlucid:entra-scim:{scimUser.TenantId:D}");

            await RecordReviewAsync(
                    ScimLegacySourceType,
                    scimUser.ScimUserId,
                    scimUser.TenantId,
                    IdentityMigrationReviewReason.MissingEntraTenantId,
                    "Tenant EntraTenantId missing; SCIM identity issuer falls back to tenant-scoped synthetic issuer.",
                    cancellationToken)
                .ConfigureAwait(false);

            reviewItemRecorded = true;
        }

        ExternalIdentityKey key = new()
        {
            ProviderType = AuthenticationProviderType.MicrosoftIdentity,
            NormalizedIssuer = normalizedIssuer,
            Subject = scimUser.ExternalId.Trim(),
            TenantId = scimUser.TenantId
        };

        return (key, reviewItemRecorded);
    }

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
