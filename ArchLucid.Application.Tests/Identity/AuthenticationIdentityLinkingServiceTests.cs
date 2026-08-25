using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class AuthenticationIdentityLinkingServiceTests
{
    private static AuthenticationIdentityLinkingService CreateSut(
        out InMemoryPlatformUserRepository users,
        out InMemoryAuthenticationIdentityRepository identities,
        out InMemoryAuthenticationIdentityLinkProposalRepository proposals,
        out InMemoryIdentityMigrationReviewRepository reviews,
        out InMemoryEmailOtpChallengeRepository challenges,
        FakeTimeProvider? clock = null)
    {
        users = new InMemoryPlatformUserRepository();
        identities = new InMemoryAuthenticationIdentityRepository();
        proposals = new InMemoryAuthenticationIdentityLinkProposalRepository();
        reviews = new InMemoryIdentityMigrationReviewRepository();
        challenges = new InMemoryEmailOtpChallengeRepository();

        Mock<IAuditService> audit = new();
        audit.Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IEmailOtpEmailNotifier> notifier = new();
        notifier.Setup(n => n.TrySendSignInCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        PlatformIdentityService platformIdentity = new(
            users,
            identities,
            new InMemoryWorkspaceMembershipRepository(),
            audit.Object,
            clock ?? new FakeTimeProvider(DateTimeOffset.UtcNow));

        AuthSignInRoutingService routing = new(
            new InMemoryTenantSignInEmailDomainRepository(),
            new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
            new InMemoryTenantIdentityProviderConfigurationRepository(),
            new InMemoryUserInvitationRepository(),
            new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
            clock ?? TimeProvider.System);

        TimeProvider clockProvider = clock ?? new FakeTimeProvider(DateTimeOffset.UtcNow);

        AuthenticationIdentityLinkProposalService proposalService = new(
            platformIdentity,
            users,
            identities,
            proposals,
            reviews,
            audit.Object,
            clockProvider);

        AuthenticationIdentityLinkChallengeService challengeService = new(
            identities,
            proposalService,
            challenges,
            notifier.Object,
            audit.Object,
            Options.Create(new EmailOtpAuthOptions { Enabled = true, CodeLength = 6, CodeLifetimeMinutes = 10 }),
            clockProvider);

        return new AuthenticationIdentityLinkingService(
            platformIdentity,
            identities,
            challengeService,
            proposalService,
            new SignInMethodRemovalPolicyService(identities, users, routing),
            audit.Object);
    }

    [Fact]
    public async Task ConfirmLinkProposalAsync_attaches_email_code_to_existing_user()
    {
        AuthenticationIdentityLinkingService sut = CreateSut(
            out InMemoryPlatformUserRepository users,
            out InMemoryAuthenticationIdentityRepository identities,
            out InMemoryAuthenticationIdentityLinkProposalRepository proposals,
            out _,
            out _,
            clock: new FakeTimeProvider(DateTimeOffset.UtcNow));

        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = "primary@example.com",
                NormalizedPrimaryEmail = "primary@example.com",
                DisplayName = "User",
                Status = PlatformUserStatus.Active
            },
            CancellationToken.None);

        await identities.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = user.Id,
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = "https://login.microsoftonline.com/tenant/v2.0",
                Subject = "oid-1"
            },
            CancellationToken.None);

        DateTimeOffset now = DateTimeOffset.UtcNow;
        AuthenticationIdentityLinkProposalRecord proposal = new()
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            ProviderType = AuthenticationProviderType.EmailOneTimeCode,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
            Subject = "recovery@example.com",
            NormalizedEmail = "recovery@example.com",
            DisplayEmail = "recovery@example.com",
            EmailVerified = true,
            RequiresExplicitConfirmation = true,
            Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,
            CreatedUtc = now,
            ExpiresUtc = now.AddMinutes(15)
        };

        await proposals.InsertAsync(proposal, CancellationToken.None);

        AuthenticationIdentityRecord attached = await sut.ConfirmLinkProposalAsync(
            user.Id,
            proposal.Id,
            user.Id.ToString("D"),
            CancellationToken.None);

        Assert.Equal(AuthenticationProviderType.EmailOneTimeCode, attached.ProviderType);
        Assert.Equal(2, (await identities.ListByUserIdAsync(user.Id, CancellationToken.None)).Count(row => row.IsActive));
    }

    [Fact]
    public async Task ConfirmLinkProposalAsync_rejects_external_identity_attached_to_another_user()
    {
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        AuthenticationIdentityLinkingService sut = CreateSut(
            out InMemoryPlatformUserRepository users,
            out InMemoryAuthenticationIdentityRepository identities,
            out InMemoryAuthenticationIdentityLinkProposalRepository proposals,
            out InMemoryIdentityMigrationReviewRepository reviews,
            out _,
            clock: clock);

        PlatformUserRecord owner = await users.InsertAsync(
            new PlatformUserInsert { DisplayName = "Owner", Status = PlatformUserStatus.Active },
            CancellationToken.None);

        PlatformUserRecord linker = await users.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = "linker@example.com",
                NormalizedPrimaryEmail = "linker@example.com",
                DisplayName = "Linker",
                Status = PlatformUserStatus.Active
            },
            CancellationToken.None);

        await identities.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = owner.Id,
                ProviderType = AuthenticationProviderType.GoogleIdentity,
                NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.GoogleAccountsIssuer),
                Subject = "google-subject"
            },
            CancellationToken.None);

        DateTimeOffset now = DateTimeOffset.UtcNow;
        AuthenticationIdentityLinkProposalRecord proposal = new()
        {
            Id = Guid.NewGuid(),
            UserId = linker.Id,
            ProviderType = AuthenticationProviderType.GoogleIdentity,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.GoogleAccountsIssuer),
            Subject = "google-subject",
            EmailVerified = true,
            Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,
            CreatedUtc = now,
            ExpiresUtc = now.AddMinutes(15)
        };

        await proposals.InsertAsync(proposal, CancellationToken.None);

        await Assert.ThrowsAsync<IdentityAlreadyAttachedToAnotherUserException>(() =>
            sut.ConfirmLinkProposalAsync(linker.Id, proposal.Id, linker.Id.ToString("D"), CancellationToken.None));

        IReadOnlyList<IdentityMigrationReviewItemRecord> reviewItems =
            await reviews.ListUnresolvedAsync(CancellationToken.None);

        Assert.NotEmpty(reviewItems);
    }

    [Fact]
    public async Task VerifyEmailLinkChallengeAsync_creates_proposal_for_sso_user_adding_email_code()
    {
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        AuthenticationIdentityLinkingService sut = CreateSut(
            out InMemoryPlatformUserRepository users,
            out InMemoryAuthenticationIdentityRepository identities,
            out InMemoryAuthenticationIdentityLinkProposalRepository proposals,
            out _,
            out InMemoryEmailOtpChallengeRepository challenges,
            clock: clock);

        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = "primary@example.com",
                NormalizedPrimaryEmail = "primary@example.com",
                DisplayName = "User",
                Status = PlatformUserStatus.Active
            },
            CancellationToken.None);

        await identities.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = user.Id,
                ProviderType = AuthenticationProviderType.MicrosoftIdentity,
                NormalizedIssuer = "https://login.microsoftonline.com/tenant/v2.0",
                Subject = "oid-1"
            },
            CancellationToken.None);

        Guid challengeId = Guid.NewGuid();
        const string code = "123456";
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, code, string.Empty);

        await challenges.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = "recovery@example.com",
                CodeHash = codeHash,
                ExpiresUtc = clock.GetUtcNow().AddMinutes(10)
            },
            CancellationToken.None);

        AuthenticationIdentityLinkProposalView proposal = await sut.VerifyEmailLinkChallengeAsync(
            user.Id,
            challengeId,
            code,
            user.Id.ToString("D"),
            CancellationToken.None);

        Assert.NotEqual(Guid.Empty, proposal.ProposalId);
        Assert.True(proposal.RequiresExplicitConfirmation);

        AuthenticationIdentityLinkProposalRecord? stored =
            await proposals.GetByIdAsync(proposal.ProposalId, CancellationToken.None);

        Assert.NotNull(stored);
        Assert.Equal(AuthenticationIdentityLinkProposalStatus.PendingConfirmation, stored.Status);
    }

    [Fact]
    public async Task RemoveSignInMethodAsync_blocks_removal_of_final_method()
    {
        AuthenticationIdentityLinkingService sut = CreateSut(
            out InMemoryPlatformUserRepository users,
            out InMemoryAuthenticationIdentityRepository identities,
            out _,
            out _,
            out _);

        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert { DisplayName = "Solo", Status = PlatformUserStatus.Active },
            CancellationToken.None);

        AuthenticationIdentityRecord identity = await identities.InsertAsync(
            new AuthenticationIdentityInsert
            {
                UserId = user.Id,
                ProviderType = AuthenticationProviderType.EmailOneTimeCode,
                NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
                Subject = "solo@example.com",
                NormalizedEmail = "solo@example.com",
                DisplayEmail = "solo@example.com",
                EmailVerified = true
            },
            CancellationToken.None);

        await Assert.ThrowsAsync<SignInMethodRemovalBlockedException>(() =>
            sut.RemoveSignInMethodAsync(user.Id, identity.Id, user.Id.ToString("D"), CancellationToken.None));
    }
}
