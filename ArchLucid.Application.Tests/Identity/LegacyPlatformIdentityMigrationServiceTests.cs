using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class LegacyPlatformIdentityMigrationServiceTests
{
    private static LegacyPlatformIdentityMigrationService CreateSut(
        InMemoryLegacyPlatformIdentityMigrationSource legacySource,
        out PlatformIdentityService platformIdentity,
        FakeTimeProvider? timeProvider = null)
    {
        InMemoryPlatformUserRepository users = new();
        InMemoryAuthenticationIdentityRepository identities = new();
        InMemoryWorkspaceMembershipRepository memberships = new();
        InMemoryIdentityMigrationReviewRepository reviewItems = new();
        Mock<IAuditService> audit = new();

        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        FakeTimeProvider clock = timeProvider ?? new FakeTimeProvider(DateTimeOffset.UtcNow);

        platformIdentity = new PlatformIdentityService(
            users,
            identities,
            memberships,
            audit.Object,
            clock);

        return new LegacyPlatformIdentityMigrationService(
            legacySource,
            platformIdentity,
            memberships,
            reviewItems,
            clock);
    }

    [Fact]
    public async Task MigrateAsync_creates_platform_users_identities_and_memberships_for_legacy_rows()
    {
        InMemoryLegacyPlatformIdentityMigrationSource legacySource = new();
        Guid tenantId = Guid.NewGuid();
        Guid entraTenantId = Guid.NewGuid();
        Guid scimUserId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid trialUserId = Guid.NewGuid();

        legacySource.SetEntraTenantId(tenantId, entraTenantId.ToString("D"));
        legacySource.SetDefaultWorkspaceId(tenantId, workspaceId);

        legacySource.SeedScimUser(new LegacyScimUserMigrationRow
        {
            ScimUserId = scimUserId,
            TenantId = tenantId,
            ExternalId = "entra-oid-1",
            UserName = "scim.user@example.com",
            DisplayName = "Scim User",
            Active = true,
            ResolvedRole = "Reader"
        });

        legacySource.SeedTrialUser(new LegacyTrialIdentityMigrationRow
        {
            IdentityUserId = trialUserId,
            Email = "trial@example.com",
            NormalizedEmail = "trial@example.com",
            EmailConfirmed = true,
            EmailVerifiedUtc = DateTimeOffset.UtcNow
        });

        LegacyPlatformIdentityMigrationService sut = CreateSut(legacySource, out PlatformIdentityService platformIdentity);

        IdentityMigrationReport firstPass = await sut.MigrateAsync(CancellationToken.None);

        Assert.Equal(2, firstPass.PlatformUsersCreated);
        Assert.Equal(2, firstPass.AuthenticationIdentitiesCreated);
        Assert.Equal(1, firstPass.WorkspaceMembershipsCreated);

        PlatformUserRecord? scimPlatformUser = await platformIdentity.FindUserByExternalIdentityAsync(
            new ExternalIdentityKey
            {
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = IdentityIssuerNormalizer.NormalizeMicrosoftEntraIssuer(entraTenantId),
                Subject = "entra-oid-1",
                TenantId = tenantId
            },
            CancellationToken.None);

        Assert.NotNull(scimPlatformUser);
        Assert.Equal("scim.user@example.com", scimPlatformUser.PrimaryEmail);

        IdentityMigrationReport secondPass = await sut.MigrateAsync(CancellationToken.None);

        Assert.Equal(0, secondPass.PlatformUsersCreated);
        Assert.Equal(0, secondPass.AuthenticationIdentitiesCreated);
        Assert.Equal(0, secondPass.WorkspaceMembershipsCreated);
    }

    [Fact]
    public async Task MigrateAsync_records_review_for_duplicate_external_identity()
    {
        InMemoryLegacyPlatformIdentityMigrationSource legacySource = new();
        Guid tenantId = Guid.NewGuid();
        Guid entraTenantId = Guid.NewGuid();

        legacySource.SetEntraTenantId(tenantId, entraTenantId.ToString("D"));

        legacySource.SeedScimUser(new LegacyScimUserMigrationRow
        {
            ScimUserId = Guid.NewGuid(),
            TenantId = tenantId,
            ExternalId = "shared-oid",
            UserName = "first@example.com",
            Active = true
        });

        legacySource.SeedScimUser(new LegacyScimUserMigrationRow
        {
            ScimUserId = Guid.NewGuid(),
            TenantId = tenantId,
            ExternalId = "shared-oid",
            UserName = "second@example.com",
            Active = true
        });

        LegacyPlatformIdentityMigrationService sut = CreateSut(legacySource, out _);

        IdentityMigrationReport report = await sut.MigrateAsync(CancellationToken.None);

        Assert.Equal(1, report.PlatformUsersCreated);
        Assert.True(report.ReviewItemsCreated >= 1);
        Assert.Contains(
            report.ReviewItems,
            item => item.ReasonCode == IdentityMigrationReviewReason.DuplicateExternalIdentity);
    }

    [Fact]
    public async Task MigrateAsync_records_review_for_missing_entra_tenant_and_missing_default_workspace()
    {
        InMemoryLegacyPlatformIdentityMigrationSource legacySource = new();
        Guid tenantId = Guid.NewGuid();
        Guid scimUserId = Guid.NewGuid();

        legacySource.SeedScimUser(new LegacyScimUserMigrationRow
        {
            ScimUserId = scimUserId,
            TenantId = tenantId,
            ExternalId = "oid-no-workspace",
            UserName = "orphan@example.com",
            Active = true
        });

        LegacyPlatformIdentityMigrationService sut = CreateSut(legacySource, out _);

        IdentityMigrationReport report = await sut.MigrateAsync(CancellationToken.None);

        Assert.Contains(
            report.ReviewItems,
            item => item.ReasonCode == IdentityMigrationReviewReason.MissingEntraTenantId);

        Assert.Contains(
            report.ReviewItems,
            item => item.ReasonCode == IdentityMigrationReviewReason.MissingDefaultWorkspace);
    }

    [Fact]
    public async Task MigrateAsync_records_review_for_linked_entra_oid_on_trial_user()
    {
        InMemoryLegacyPlatformIdentityMigrationSource legacySource = new();
        Guid trialUserId = Guid.NewGuid();

        legacySource.SeedTrialUser(new LegacyTrialIdentityMigrationRow
        {
            IdentityUserId = trialUserId,
            Email = "linked@example.com",
            NormalizedEmail = "linked@example.com",
            EmailConfirmed = true,
            EmailVerifiedUtc = DateTimeOffset.UtcNow,
            LinkedEntraOid = "linked-entra-oid"
        });

        LegacyPlatformIdentityMigrationService sut = CreateSut(legacySource, out _);

        IdentityMigrationReport report = await sut.MigrateAsync(CancellationToken.None);

        Assert.Equal(1, report.PlatformUsersCreated);
        Assert.Contains(
            report.ReviewItems,
            item => item.ReasonCode == IdentityMigrationReviewReason.LinkedEntraOidConflict
                    && item.LegacySourceId == trialUserId);
    }

    [Fact]
    public async Task MigrateAsync_does_not_merge_users_with_matching_email_across_providers()
    {
        InMemoryLegacyPlatformIdentityMigrationSource legacySource = new();
        Guid tenantId = Guid.NewGuid();
        Guid entraTenantId = Guid.NewGuid();
        const string sharedEmail = "same.email@example.com";

        legacySource.SetEntraTenantId(tenantId, entraTenantId.ToString("D"));
        legacySource.SetDefaultWorkspaceId(tenantId, Guid.NewGuid());

        legacySource.SeedScimUser(new LegacyScimUserMigrationRow
        {
            ScimUserId = Guid.NewGuid(),
            TenantId = tenantId,
            ExternalId = "oid-email-a",
            UserName = sharedEmail,
            Active = true
        });

        legacySource.SeedTrialUser(new LegacyTrialIdentityMigrationRow
        {
            IdentityUserId = Guid.NewGuid(),
            Email = sharedEmail,
            NormalizedEmail = sharedEmail,
            EmailConfirmed = true,
            EmailVerifiedUtc = DateTimeOffset.UtcNow
        });

        LegacyPlatformIdentityMigrationService sut = CreateSut(legacySource, out PlatformIdentityService platformIdentity);

        IdentityMigrationReport report = await sut.MigrateAsync(CancellationToken.None);

        Assert.Equal(2, report.PlatformUsersCreated);
        Assert.DoesNotContain(
            report.ReviewItems,
            item => item.ReasonCode == IdentityMigrationReviewReason.EmailCollisionNoMerge);

        IReadOnlyList<LegacyTrialIdentityMigrationRow> trialRows =
            await legacySource.ListTrialIdentityUsersAsync(CancellationToken.None);

        PlatformUserRecord? scimUser = await platformIdentity.FindUserByExternalIdentityAsync(
            new ExternalIdentityKey
            {
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = IdentityIssuerNormalizer.NormalizeMicrosoftEntraIssuer(entraTenantId),
                Subject = "oid-email-a",
                TenantId = tenantId
            },
            CancellationToken.None);

        PlatformUserRecord? trialUser = await platformIdentity.FindUserByExternalIdentityAsync(
            new ExternalIdentityKey
            {
                ProviderType = AuthenticationProviderType.TrialLocalPassword,
                NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.TrialLocalPassword),
                Subject = trialRows[0].IdentityUserId.ToString("D")
            },
            CancellationToken.None);

        Assert.NotNull(scimUser);
        Assert.NotNull(trialUser);
        Assert.NotEqual(scimUser.Id, trialUser.Id);
    }
}
