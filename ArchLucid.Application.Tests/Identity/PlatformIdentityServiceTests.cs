using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class PlatformIdentityServiceTests
{
    private static PlatformIdentityService CreateSut(
        out InMemoryPlatformUserRepository users,
        out InMemoryAuthenticationIdentityRepository identities,
        out InMemoryWorkspaceMembershipRepository memberships,
        FakeTimeProvider? timeProvider = null,
        Mock<IAuditService>? audit = null)
    {
        users = new InMemoryPlatformUserRepository();
        identities = new InMemoryAuthenticationIdentityRepository();
        memberships = new InMemoryWorkspaceMembershipRepository();
        Mock<IAuditService> auditMock = audit ?? new Mock<IAuditService>();

        auditMock
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        FakeTimeProvider clock = timeProvider ?? new FakeTimeProvider(DateTimeOffset.UtcNow);

        return new PlatformIdentityService(users, identities, memberships, auditMock.Object, clock);
    }

    private static ExternalIdentityKey MicrosoftKey(Guid entraTenantId, string subject, Guid? tenantId = null) =>
        new()
        {
            ProviderType = AuthenticationProviderType.MicrosoftIdentity,
            NormalizedIssuer = IdentityIssuerNormalizer.NormalizeMicrosoftEntraIssuer(entraTenantId),
            Subject = subject,
            TenantId = tenantId
        };

    private static ExternalIdentityKey GoogleKey(string subject) =>
        new()
        {
            ProviderType = AuthenticationProviderType.GoogleIdentity,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.GoogleAccountsIssuer),
            Subject = subject
        };

    private static VerifiedExternalIdentityCreateRequest CreateRequest(
        ExternalIdentityKey key,
        string actorId = "test-actor",
        string? displayEmail = null,
        string? primaryContactEmail = null,
        bool emailVerified = false,
        string? displayName = "Test User") =>
        new()
        {
            ExternalKey = key,
            DisplayEmail = displayEmail,
            PrimaryContactEmail = primaryContactEmail,
            EmailVerified = emailVerified,
            DisplayName = displayName,
            ActorId = actorId,
            TenantIdForAudit = key.TenantId
        };

    [Fact]
    public async Task CreateUserFromVerifiedIdentityAsync_one_user_can_attach_multiple_identities()
    {
        PlatformIdentityService sut = CreateSut(
            out _,
            out _,
            out _);

        Guid entraTenantId = Guid.NewGuid();
        Guid archLucidTenantId = Guid.NewGuid();

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(MicrosoftKey(entraTenantId, "oid-1", archLucidTenantId), displayName: "Multi Id User"),
            CancellationToken.None);

        await sut.AttachIdentityToExistingUserAsync(
            user.Id,
            CreateRequest(GoogleKey("google-sub-1"), displayEmail: "user@example.com", emailVerified: true),
            CancellationToken.None);

        IReadOnlyList<AuthenticationIdentityRecord> attached =
            await sut.GetIdentitiesForUserAsync(user.Id, CancellationToken.None);

        Assert.Equal(2, attached.Count);
        Assert.Contains(attached, row => row.ProviderType == AuthenticationProviderType.MicrosoftIdentity);
        Assert.Contains(attached, row => row.ProviderType == AuthenticationProviderType.GoogleIdentity);
        Assert.True(await sut.HasValidSignInMethodAsync(user.Id, CancellationToken.None));
    }

    [Fact]
    public async Task CreateUserFromVerifiedIdentityAsync_rejects_duplicate_issuer_and_subject()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        ExternalIdentityKey key = GoogleKey("duplicate-subject");

        await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(key, displayEmail: "first@example.com", emailVerified: true),
            CancellationToken.None);

        await Assert.ThrowsAsync<DuplicateAuthenticationIdentityException>(() =>
            sut.CreateUserFromVerifiedIdentityAsync(
                CreateRequest(key, displayEmail: "second@example.com", emailVerified: true),
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateUserFromVerifiedIdentityAsync_same_email_different_providers_creates_distinct_users()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        const string sharedEmail = "shared@example.com";

        PlatformUserRecord microsoftUser = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(
                MicrosoftKey(Guid.NewGuid(), "oid-a"),
                displayEmail: sharedEmail,
                emailVerified: true),
            CancellationToken.None);

        PlatformUserRecord googleUser = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(
                GoogleKey("google-sub-b"),
                displayEmail: sharedEmail,
                emailVerified: true),
            CancellationToken.None);

        Assert.NotEqual(microsoftUser.Id, googleUser.Id);
        Assert.Equal(sharedEmail, microsoftUser.PrimaryEmail);
        Assert.Equal(sharedEmail, googleUser.PrimaryEmail);
    }

    [Fact]
    public async Task CreateUserFromVerifiedIdentityAsync_rejects_unverified_email_claim_for_identity_association()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        await Assert.ThrowsAsync<UnverifiedEmailIdentityAssociationException>(() =>
            sut.CreateUserFromVerifiedIdentityAsync(
                CreateRequest(
                    GoogleKey("unverified-subject"),
                    displayEmail: "unverified@example.com",
                    emailVerified: false),
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateUserFromVerifiedIdentityAsync_accepts_verified_email_claim_on_identity()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(
                GoogleKey("verified-subject"),
                displayEmail: "verified@example.com",
                emailVerified: true),
            CancellationToken.None);

        IReadOnlyList<AuthenticationIdentityRecord> identities =
            await sut.GetIdentitiesForUserAsync(user.Id, CancellationToken.None);

        AuthenticationIdentityRecord identity = Assert.Single(identities);

        Assert.True(identity.EmailVerified);
        Assert.Equal("verified@example.com", identity.DisplayEmail);
    }

    [Fact]
    public async Task CreateUserFromVerifiedIdentityAsync_stores_primary_contact_email_without_verified_identity_email()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(
                MicrosoftKey(Guid.NewGuid(), "oid-contact", Guid.NewGuid()),
                primaryContactEmail: "contact@example.com",
                emailVerified: false),
            CancellationToken.None);

        IReadOnlyList<AuthenticationIdentityRecord> identities =
            await sut.GetIdentitiesForUserAsync(user.Id, CancellationToken.None);

        AuthenticationIdentityRecord identity = Assert.Single(identities);

        Assert.Equal("contact@example.com", user.PrimaryEmail);
        Assert.Null(identity.DisplayEmail);
        Assert.False(identity.EmailVerified);
    }

    [Fact]
    public async Task WorkspaceMembershipRepository_supports_multiple_memberships_for_one_user()
    {
        PlatformIdentityService sut = CreateSut(
            out _,
            out _,
            out InMemoryWorkspaceMembershipRepository memberships);

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(MicrosoftKey(Guid.NewGuid(), "membership-subject")),
            CancellationToken.None);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceOne = Guid.NewGuid();
        Guid workspaceTwo = Guid.NewGuid();
        DateTimeOffset now = DateTimeOffset.UtcNow;

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = user.Id,
                TenantId = tenantId,
                WorkspaceId = workspaceOne,
                Role = "Reader",
                Status = WorkspaceMembershipStatus.Active
            },
            now,
            CancellationToken.None);

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = user.Id,
                TenantId = tenantId,
                WorkspaceId = workspaceTwo,
                Role = "Operator",
                Status = WorkspaceMembershipStatus.Active
            },
            now,
            CancellationToken.None);

        IReadOnlyList<WorkspaceMembershipRecord> rows =
            await memberships.ListByUserIdAsync(user.Id, CancellationToken.None);

        Assert.Equal(2, rows.Count);
    }

    [Fact]
    public async Task AttachIdentityToExistingUserAsync_rejects_cross_tenant_attachment_without_membership()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        Guid tenantId = Guid.NewGuid();

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(GoogleKey("global-subject")),
            CancellationToken.None);

        ExternalIdentityKey tenantScopedKey = MicrosoftKey(Guid.NewGuid(), "tenant-oid", tenantId);

        await Assert.ThrowsAsync<CrossTenantIdentityAttachmentException>(() =>
            sut.AttachIdentityToExistingUserAsync(
                user.Id,
                CreateRequest(tenantScopedKey),
                CancellationToken.None));
    }

    [Fact]
    public async Task AttachIdentityToExistingUserAsync_allows_tenant_scoped_attachment_when_membership_exists()
    {
        PlatformIdentityService sut = CreateSut(
            out _,
            out _,
            out InMemoryWorkspaceMembershipRepository memberships);

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(GoogleKey("global-subject")),
            CancellationToken.None);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = user.Id,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                Role = "Reader",
                Status = WorkspaceMembershipStatus.Active
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        AuthenticationIdentityRecord attached = await sut.AttachIdentityToExistingUserAsync(
            user.Id,
            CreateRequest(MicrosoftKey(Guid.NewGuid(), "tenant-oid", tenantId)),
            CancellationToken.None);

        Assert.Equal(user.Id, attached.UserId);
        Assert.Equal(tenantId, attached.TenantId);
    }

    [Fact]
    public async Task DisableIdentityAsync_blocks_removal_of_final_valid_sign_in_method()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(GoogleKey("only-sign-in")),
            CancellationToken.None);

        IReadOnlyList<AuthenticationIdentityRecord> identities =
            await sut.GetIdentitiesForUserAsync(user.Id, CancellationToken.None);

        Guid identityId = Assert.Single(identities).Id;

        await Assert.ThrowsAsync<FinalSignInMethodRemovalException>(() =>
            sut.DisableIdentityAsync(identityId, "admin", CancellationToken.None));

        Assert.True(await sut.HasValidSignInMethodAsync(user.Id, CancellationToken.None));
    }

    [Fact]
    public async Task DisableIdentityAsync_allows_disabling_one_identity_when_another_remains_active()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(MicrosoftKey(Guid.NewGuid(), "keep-me")),
            CancellationToken.None);

        AuthenticationIdentityRecord secondary = await sut.AttachIdentityToExistingUserAsync(
            user.Id,
            CreateRequest(GoogleKey("disable-me")),
            CancellationToken.None);

        await sut.DisableIdentityAsync(secondary.Id, "admin", CancellationToken.None);

        IReadOnlyList<AuthenticationIdentityRecord> remaining =
            await sut.GetIdentitiesForUserAsync(user.Id, CancellationToken.None);

        Assert.Equal(2, remaining.Count);
        Assert.Single(remaining, row => row.DisabledUtc is null);
        Assert.True(await sut.HasValidSignInMethodAsync(user.Id, CancellationToken.None));
    }

    [Fact]
    public async Task DisableIdentityAsync_rotates_platform_user_auth_version()
    {
        PlatformIdentityService sut = CreateSut(out InMemoryPlatformUserRepository users, out _, out _);

        PlatformUserRecord user = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(MicrosoftKey(Guid.NewGuid(), "keep-me")),
            CancellationToken.None);

        AuthenticationIdentityRecord secondary = await sut.AttachIdentityToExistingUserAsync(
            user.Id,
            CreateRequest(GoogleKey("disable-me")),
            CancellationToken.None);

        Guid authVersionBeforeDisable = (await users.GetByIdAsync(user.Id, CancellationToken.None))!.AuthVersion;

        await sut.DisableIdentityAsync(secondary.Id, "admin", CancellationToken.None);

        PlatformUserRecord? updated = await users.GetByIdAsync(user.Id, CancellationToken.None);

        Assert.NotNull(updated);
        Assert.NotEqual(authVersionBeforeDisable, updated.AuthVersion);
    }

    [Fact]
    public async Task FindUserByExternalIdentityAsync_returns_user_for_active_identity()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        ExternalIdentityKey key = GoogleKey("lookup-subject");

        PlatformUserRecord created = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(key),
            CancellationToken.None);

        PlatformUserRecord? found = await sut.FindUserByExternalIdentityAsync(key, CancellationToken.None);

        Assert.NotNull(found);
        Assert.Equal(created.Id, found.Id);
    }

    [Fact]
    public async Task CreateUserFromVerifiedIdentityAsync_rejects_external_key_reserved_by_disabled_identity()
    {
        PlatformIdentityService sut = CreateSut(out _, out _, out _);

        ExternalIdentityKey emailKey = new()
        {
            ProviderType = AuthenticationProviderType.EmailOneTimeCode,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
            Subject = "reserved@example.com"
        };

        PlatformUserRecord owner = await sut.CreateUserFromVerifiedIdentityAsync(
            CreateRequest(
                MicrosoftKey(Guid.NewGuid(), "owner-subject"),
                displayEmail: "owner@example.com",
                emailVerified: true),
            CancellationToken.None);

        AuthenticationIdentityRecord attached = await sut.AttachIdentityToExistingUserAsync(
            owner.Id,
            CreateRequest(emailKey, displayEmail: "reserved@example.com", emailVerified: true),
            CancellationToken.None);

        await sut.DisableIdentityAsync(attached.Id, "admin", CancellationToken.None);

        await Assert.ThrowsAsync<DuplicateAuthenticationIdentityException>(() =>
            sut.CreateUserFromVerifiedIdentityAsync(
                CreateRequest(emailKey, displayEmail: "reserved@example.com", emailVerified: true),
                CancellationToken.None));
    }
}
