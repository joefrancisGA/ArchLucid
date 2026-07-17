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

public sealed class AuthenticationIdentityLinkingAdversarialTests

{

    private static AuthenticationIdentityLinkingService CreateSut(

        out InMemoryPlatformUserRepository users,

        out InMemoryAuthenticationIdentityRepository identities,

        out InMemoryAuthenticationIdentityLinkProposalRepository proposals,

        out InMemoryEmailOtpChallengeRepository challenges,

        FakeTimeProvider? clock = null)

    {

        users = new InMemoryPlatformUserRepository();

        identities = new InMemoryAuthenticationIdentityRepository();

        proposals = new InMemoryAuthenticationIdentityLinkProposalRepository();

        InMemoryIdentityMigrationReviewRepository reviews = new();

        challenges = new InMemoryEmailOtpChallengeRepository();



        Mock<IAuditService> audit = new();

        audit.Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))

            .Returns(Task.CompletedTask);



        Mock<IEmailOtpEmailNotifier> notifier = new();

        notifier.Setup(n => n.TrySendSignInCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))

            .ReturnsAsync(true);



        FakeTimeProvider timeProvider = clock ?? new FakeTimeProvider(DateTimeOffset.UtcNow);



        PlatformIdentityService platformIdentity = new(

            users,

            identities,

            new InMemoryWorkspaceMembershipRepository(),

            audit.Object,

            timeProvider);



        return new AuthenticationIdentityLinkingService(

            platformIdentity,

            users,

            identities,

            proposals,

            reviews,

            challenges,

            notifier.Object,

            new SignInMethodRemovalPolicyService(

                identities,

                users,

                new AuthSignInRoutingService(

                    new InMemoryTenantSignInEmailDomainRepository(),

                    new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),

                    new InMemoryTenantIdentityProviderConfigurationRepository(),

                    new InMemoryUserInvitationRepository(),

                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),

                    timeProvider)),

            audit.Object,

            Options.Create(new EmailOtpAuthOptions { Enabled = true, CodeLength = 6, CodeLifetimeMinutes = 10 }),

            timeProvider);

    }



    [Fact]

    public async Task ConfirmLink_rejects_reused_otp_challenge()

    {

        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        AuthenticationIdentityLinkingService sut = CreateSut(

            out InMemoryPlatformUserRepository users,

            out _,

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



        await sut.VerifyEmailLinkChallengeAsync(user.Id, challengeId, code, user.Id.ToString("D"), CancellationToken.None);



        await Assert.ThrowsAsync<ArgumentException>(() =>

            sut.VerifyEmailLinkChallengeAsync(user.Id, challengeId, code, user.Id.ToString("D"), CancellationToken.None));

    }



    [Fact]

    public async Task CreateProposal_rejects_email_bound_to_other_user()

    {

        AuthenticationIdentityLinkingService sut = CreateSut(

            out InMemoryPlatformUserRepository users,

            out InMemoryAuthenticationIdentityRepository identities,

            out _,

            out _);



        PlatformUserRecord owner = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "Owner", Status = PlatformUserStatus.Active },

            CancellationToken.None);



        PlatformUserRecord linker = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "Linker", Status = PlatformUserStatus.Active },

            CancellationToken.None);



        await identities.InsertAsync(

            new AuthenticationIdentityInsert

            {

                UserId = owner.Id,

                ProviderType = AuthenticationProviderType.EmailOneTimeCode,

                NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),

                Subject = "taken@example.com",

                NormalizedEmail = "taken@example.com",

                DisplayEmail = "taken@example.com",

                EmailVerified = true

            },

            CancellationToken.None);



        await Assert.ThrowsAsync<IdentityAlreadyAttachedToAnotherUserException>(() =>

            sut.RequestEmailLinkChallengeAsync(linker.Id, "taken@example.com", linker.Id.ToString("D"), CancellationToken.None));

    }



    [Fact]

    public async Task ConfirmLink_rejects_subject_owned_by_other_user()

    {

        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        AuthenticationIdentityLinkingService sut = CreateSut(

            out InMemoryPlatformUserRepository users,

            out InMemoryAuthenticationIdentityRepository identities,

            out InMemoryAuthenticationIdentityLinkProposalRepository proposals,

            out _,

            clock: clock);



        PlatformUserRecord owner = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "Owner", Status = PlatformUserStatus.Active },

            CancellationToken.None);



        PlatformUserRecord linker = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "Linker", Status = PlatformUserStatus.Active },

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



        DateTimeOffset now = clock.GetUtcNow();

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

    }



    [Fact]

    public async Task ConfirmLink_rejects_other_users_proposal()

    {

        AuthenticationIdentityLinkingService sut = CreateSut(

            out InMemoryPlatformUserRepository users,

            out _,

            out InMemoryAuthenticationIdentityLinkProposalRepository proposals,

            out _);



        PlatformUserRecord victim = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "Victim", Status = PlatformUserStatus.Active },

            CancellationToken.None);



        PlatformUserRecord attacker = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "Attacker", Status = PlatformUserStatus.Active },

            CancellationToken.None);



        DateTimeOffset now = DateTimeOffset.UtcNow;

        AuthenticationIdentityLinkProposalRecord proposal = new()

        {

            Id = Guid.NewGuid(),

            UserId = victim.Id,

            ProviderType = AuthenticationProviderType.EmailOneTimeCode,

            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),

            Subject = "victim@example.com",

            NormalizedEmail = "victim@example.com",

            DisplayEmail = "victim@example.com",

            EmailVerified = true,

            Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,

            CreatedUtc = now,

            ExpiresUtc = now.AddMinutes(15)

        };



        await proposals.InsertAsync(proposal, CancellationToken.None);



        await Assert.ThrowsAsync<AuthenticationIdentityLinkProposalNotFoundException>(() =>

            sut.ConfirmLinkProposalAsync(attacker.Id, proposal.Id, attacker.Id.ToString("D"), CancellationToken.None));

    }



    [Fact]

    public async Task ConfirmLink_second_confirm_fails()

    {

        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        AuthenticationIdentityLinkingService sut = CreateSut(

            out InMemoryPlatformUserRepository users,

            out InMemoryAuthenticationIdentityRepository identities,

            out InMemoryAuthenticationIdentityLinkProposalRepository proposals,

            out _,

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



        DateTimeOffset now = clock.GetUtcNow();

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



        await sut.ConfirmLinkProposalAsync(user.Id, proposal.Id, user.Id.ToString("D"), CancellationToken.None);



        await Assert.ThrowsAsync<AuthenticationIdentityLinkProposalNotFoundException>(() =>

            sut.ConfirmLinkProposalAsync(user.Id, proposal.Id, user.Id.ToString("D"), CancellationToken.None));

    }



    [Fact]

    public async Task ConfirmLink_rejects_expired_proposal()

    {

        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        AuthenticationIdentityLinkingService sut = CreateSut(

            out InMemoryPlatformUserRepository users,

            out _,

            out InMemoryAuthenticationIdentityLinkProposalRepository proposals,

            out _,

            clock: clock);



        PlatformUserRecord user = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "User", Status = PlatformUserStatus.Active },

            CancellationToken.None);



        DateTimeOffset now = clock.GetUtcNow();

        AuthenticationIdentityLinkProposalRecord proposal = new()

        {

            Id = Guid.NewGuid(),

            UserId = user.Id,

            ProviderType = AuthenticationProviderType.EmailOneTimeCode,

            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),

            Subject = "user@example.com",

            NormalizedEmail = "user@example.com",

            DisplayEmail = "user@example.com",

            EmailVerified = true,

            Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,

            CreatedUtc = now.AddMinutes(-30),

            ExpiresUtc = now.AddMinutes(-1)

        };



        await proposals.InsertAsync(proposal, CancellationToken.None);



        await Assert.ThrowsAsync<AuthenticationIdentityLinkProposalExpiredException>(() =>

            sut.ConfirmLinkProposalAsync(user.Id, proposal.Id, user.Id.ToString("D"), CancellationToken.None));

    }



    [Fact]

    public async Task CancelLink_rejects_wrong_user()

    {

        AuthenticationIdentityLinkingService sut = CreateSut(

            out InMemoryPlatformUserRepository users,

            out _,

            out InMemoryAuthenticationIdentityLinkProposalRepository proposals,

            out _);



        PlatformUserRecord victim = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "Victim", Status = PlatformUserStatus.Active },

            CancellationToken.None);



        PlatformUserRecord attacker = await users.InsertAsync(

            new PlatformUserInsert { DisplayName = "Attacker", Status = PlatformUserStatus.Active },

            CancellationToken.None);



        DateTimeOffset now = DateTimeOffset.UtcNow;

        AuthenticationIdentityLinkProposalRecord proposal = new()

        {

            Id = Guid.NewGuid(),

            UserId = victim.Id,

            ProviderType = AuthenticationProviderType.EmailOneTimeCode,

            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),

            Subject = "victim@example.com",

            NormalizedEmail = "victim@example.com",

            DisplayEmail = "victim@example.com",

            EmailVerified = true,

            Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,

            CreatedUtc = now,

            ExpiresUtc = now.AddMinutes(15)

        };



        await proposals.InsertAsync(proposal, CancellationToken.None);



        await Assert.ThrowsAsync<AuthenticationIdentityLinkProposalNotFoundException>(() =>

            sut.CancelLinkProposalAsync(attacker.Id, proposal.Id, attacker.Id.ToString("D"), CancellationToken.None));

    }

}


