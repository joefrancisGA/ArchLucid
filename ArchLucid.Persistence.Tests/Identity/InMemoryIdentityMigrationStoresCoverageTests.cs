using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class InMemoryIdentityMigrationStoresCoverageTests
{
    [Fact]
    public async Task Review_repository_upserts_and_lists_unresolved_rows()
    {
        InMemoryIdentityMigrationReviewRepository sut = new();
        Guid legacyId = Guid.NewGuid();
        DateTimeOffset detectedUtc = DateTimeOffset.UtcNow;

        await sut.UpsertAsync(
            "scim-user",
            legacyId,
            tenantId: Guid.NewGuid(),
            IdentityMigrationReviewReason.EmailCollisionNoMerge,
            "detail",
            detectedUtc,
            CancellationToken.None);

        await sut.UpsertAsync(
            "scim-user",
            legacyId,
            tenantId: Guid.NewGuid(),
            IdentityMigrationReviewReason.EmailCollisionNoMerge,
            "updated-detail",
            detectedUtc.AddMinutes(1),
            CancellationToken.None);

        IReadOnlyList<IdentityMigrationReviewItemRecord> unresolved =
            await sut.ListUnresolvedAsync(CancellationToken.None);

        unresolved.Should().ContainSingle(row => row.LegacySourceId == legacyId);
        unresolved[0].ReasonDetail.Should().Be("updated-detail");
    }

    [Fact]
    public async Task Legacy_migration_source_lists_seeded_rows_and_links_users()
    {
        InMemoryLegacyPlatformIdentityMigrationSource sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid scimUserId = Guid.NewGuid();
        Guid trialUserId = Guid.NewGuid();
        Guid platformUserId = Guid.NewGuid();

        sut.SeedScimUser(
            new LegacyScimUserMigrationRow
            {
                ScimUserId = scimUserId,
                TenantId = tenantId,
                ExternalId = "ext",
                UserName = "user@example.com",
                DisplayName = "User",
                Active = true,
            });
        sut.SeedTrialUser(
            new LegacyTrialIdentityMigrationRow
            {
                IdentityUserId = trialUserId,
                Email = "trial@example.com",
                NormalizedEmail = "TRIAL@EXAMPLE.COM",
                EmailConfirmed = true,
            });
        sut.SeedProjectRole(
            new LegacyProjectRoleAssignmentMigrationRow
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                ScimUserId = scimUserId,
                Role = "Reader",
            });
        sut.SetEntraTenantId(tenantId, "entra-tenant");
        sut.SetDefaultWorkspaceId(tenantId, Guid.NewGuid());

        (await sut.ListScimUsersAsync(CancellationToken.None)).Should().ContainSingle(row => row.ScimUserId == scimUserId);
        (await sut.ListTrialIdentityUsersAsync(CancellationToken.None)).Should().ContainSingle(row => row.IdentityUserId == trialUserId);
        (await sut.ListProjectRoleAssignmentsAsync(CancellationToken.None)).Should().ContainSingle();
        (await sut.TryGetEntraTenantIdAsync(tenantId, CancellationToken.None)).Should().Be("entra-tenant");
        (await sut.TryGetDefaultWorkspaceIdAsync(tenantId, CancellationToken.None)).Should().NotBeNull();

        await sut.LinkScimUserAsync(scimUserId, platformUserId, CancellationToken.None);
        await sut.LinkTrialIdentityUserAsync(trialUserId, platformUserId, CancellationToken.None);

        LegacyScimUserMigrationRow linkedScim = (await sut.ListScimUsersAsync(CancellationToken.None)).Single();
        LegacyTrialIdentityMigrationRow linkedTrial = (await sut.ListTrialIdentityUsersAsync(CancellationToken.None)).Single();

        linkedScim.PlatformUserId.Should().Be(platformUserId);
        linkedTrial.PlatformUserId.Should().Be(platformUserId);
    }
}
