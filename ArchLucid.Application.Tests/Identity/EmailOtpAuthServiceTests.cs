using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Admin;
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
public sealed class EmailOtpAuthServiceTests
{
    private static EmailOtpAuthService CreateSut(
        out InMemoryEmailOtpChallengeRepository challenges,
        out InMemoryPlatformUserRepository users,
        out InMemoryAuthenticationIdentityRepository identities,
        out InMemoryWorkspaceMembershipRepository memberships,
        out InMemoryUserInvitationRepository invitations,
        out InMemoryTenantSignInEmailDomainRepository signInDomains,
        out Mock<IEmailOtpEmailNotifier> notifier,
        out Mock<IAuditService> audit,
        EmailOtpAuthOptions? options = null,
        FakeTimeProvider? clock = null)
    {
        challenges = new InMemoryEmailOtpChallengeRepository();
        users = new InMemoryPlatformUserRepository();
        identities = new InMemoryAuthenticationIdentityRepository();
        memberships = new InMemoryWorkspaceMembershipRepository();
        invitations = new InMemoryUserInvitationRepository();
        signInDomains = new InMemoryTenantSignInEmailDomainRepository();
        InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins =
            new InMemoryTenantSignInEmailDomainRecoveryAdminRepository();
        notifier = new Mock<IEmailOtpEmailNotifier>();
        audit = new Mock<IAuditService>();

        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        notifier
            .Setup(n => n.TrySendSignInCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        FakeTimeProvider timeProvider = clock ?? new FakeTimeProvider(DateTimeOffset.UtcNow);

        PlatformIdentityService platformIdentity = new(
            users,
            identities,
            memberships,
            audit.Object,
            timeProvider);

        InMemoryTenantIdentityProviderConfigurationRepository idpConfigs = new();

        IAuthSignInRoutingService routingService = new AuthSignInRoutingService(
            signInDomains,
            recoveryAdmins,
            idpConfigs,
            invitations,
            timeProvider);

        EmailOtpAuthOptions opts = options ?? new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 };

        return new EmailOtpAuthService(
            Options.Create(opts),
            challenges,
            new EmailOtpSignInDomainPolicyService(routingService),
            notifier.Object,
            platformIdentity,
            identities,
            memberships,
            invitations,
            audit.Object,
            timeProvider);
    }

    [Fact]
    public async Task RequestCodeAsync_and_VerifyCodeAsync_succeeds_for_new_user()
    {
        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _);

        EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "new.user@example.com", ClientIp = "203.0.113.10" },
            CancellationToken.None);

        Assert.NotNull(requested.ChallengeId);
        Assert.False(requested.SsoRequired);

        EmailOtpChallengeRecord challenge =
            (await challenges.GetByIdAsync(requested.ChallengeId!.Value, CancellationToken.None))!;

        string code = RecoverCodeForTests(challenge);

        EmailOtpVerifyResult verified = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest { ChallengeId = challenge.Id, Code = code },
            CancellationToken.None);

        Assert.True(verified.Succeeded);
        Assert.NotNull(verified.PlatformUserId);
        Assert.Equal(EmailOtpAuthNextStep.CreateWorkspace, verified.NextStep);
    }

    [Fact]
    public async Task VerifyCodeAsync_rejects_expired_code()
    {
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        EmailOtpAuthOptions options = new() { Enabled = true, CodeLifetimeMinutes = 10, ResendCooldownSeconds = 0 };

        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            options,
            clock);

        EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "expired@example.com" },
            CancellationToken.None);

        EmailOtpChallengeRecord challenge =
            (await challenges.GetByIdAsync(requested.ChallengeId!.Value, CancellationToken.None))!;

        string code = RecoverCodeForTests(challenge);

        clock.Advance(TimeSpan.FromMinutes(11));

        EmailOtpVerifyResult verified = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest { ChallengeId = challenge.Id, Code = code },
            CancellationToken.None);

        Assert.False(verified.Succeeded);
    }

    [Fact]
    public async Task VerifyCodeAsync_rejects_reused_code()
    {
        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _);

        EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "reuse@example.com" },
            CancellationToken.None);

        EmailOtpChallengeRecord challenge =
            (await challenges.GetByIdAsync(requested.ChallengeId!.Value, CancellationToken.None))!;

        string code = RecoverCodeForTests(challenge);

        EmailOtpVerifyResult first = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest { ChallengeId = challenge.Id, Code = code },
            CancellationToken.None);

        Assert.True(first.Succeeded);

        EmailOtpVerifyResult second = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest { ChallengeId = challenge.Id, Code = code },
            CancellationToken.None);

        Assert.False(second.Succeeded);
    }

    [Fact]
    public async Task VerifyCodeAsync_rejects_incorrect_code_and_invalidates_after_max_attempts()
    {
        EmailOtpAuthOptions options = new()
        {
            Enabled = true,
            MaxVerificationAttemptsPerChallenge = 2,
            ResendCooldownSeconds = 0
        };

        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            options);

        EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "wrong@example.com" },
            CancellationToken.None);

        Guid challengeId = requested.ChallengeId!.Value;

        await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest { ChallengeId = challengeId, Code = "000000" },
            CancellationToken.None);

        EmailOtpVerifyResult second = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest { ChallengeId = challengeId, Code = "000001" },
            CancellationToken.None);

        Assert.False(second.Succeeded);

        EmailOtpChallengeRecord? invalidated = await challenges.GetByIdAsync(challengeId, CancellationToken.None);

        Assert.NotNull(invalidated?.InvalidatedUtc);
    }

    [Fact]
    public async Task RequestCodeAsync_enforces_sso_for_registered_domain()
    {
        Guid tenantId = Guid.NewGuid();

        InMemoryTenantSignInEmailDomainRepository signInDomains = new();
        Mock<IAuditService> audit = new();

        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        signInDomains.Seed(
            new TenantSignInEmailDomainRecord
            {
                TenantId = tenantId,
                DisplayDomain = "enterprise.example",
                NormalizedDomain = "enterprise.example",
                VerificationStatus = AuthDomainVerificationStatus.Verified,
                EnforcementMode = AuthDomainEnforcementMode.SsoRequiredForVerifiedDomain,
                RequireEnterpriseSso = true,
                AllowEmailOtpRecovery = false,
                CreatedUtc = DateTimeOffset.UtcNow,
                VerifiedUtc = DateTimeOffset.UtcNow,
                RoutingTestPassedUtc = DateTimeOffset.UtcNow,
                EnforcementEnabledUtc = DateTimeOffset.UtcNow,
                DnsVerificationToken = "verification-token"
            });

        InMemoryTenantIdentityProviderConfigurationRepository idp = new();
        idp.Seed(
            new TenantIdentityProviderConfigurationRecord
            {
                TenantId = tenantId,
                Protocol = TenantIdentityProtocol.Oidc,
                IssuerUri = "https://login.enterprise.example",
                ClaimMappingJson = "{}",
                UpdatedUtc = DateTimeOffset.UtcNow,
                UpdatedByActorId = "admin",
                IsActive = true
            });

        InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins = new();

        EmailOtpAuthService sutWithIdp = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 }),
            new InMemoryEmailOtpChallengeRepository(),
            new EmailOtpSignInDomainPolicyService(
                new AuthSignInRoutingService(
                    signInDomains,
                    recoveryAdmins,
                    idp,
                    new InMemoryUserInvitationRepository(),
                    TimeProvider.System)),
            Mock.Of<IEmailOtpEmailNotifier>(),
            new PlatformIdentityService(
                new InMemoryPlatformUserRepository(),
                new InMemoryAuthenticationIdentityRepository(),
                new InMemoryWorkspaceMembershipRepository(),
                audit.Object,
                TimeProvider.System),
            new InMemoryAuthenticationIdentityRepository(),
            new InMemoryWorkspaceMembershipRepository(),
            new InMemoryUserInvitationRepository(),
            audit.Object,
            TimeProvider.System);

        EmailOtpChallengeRequestResult result = await sutWithIdp.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "user@enterprise.example" },
            CancellationToken.None);

        Assert.True(result.SsoRequired);
        Assert.Null(result.ChallengeId);
    }

    [Fact]
    public async Task VerifyCodeAsync_accepts_invitation_and_creates_membership()
    {
        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out _,
            out InMemoryWorkspaceMembershipRepository memberships,
            out InMemoryUserInvitationRepository invitations,
            out _,
            out _,
            out _);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        const string rawToken = "invite-token-12345";
        byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(rawToken);

        await invitations.InsertAsync(
            tenantId,
            workspaceId,
            "invited@example.com",
            "Reader",
            "admin",
            null,
            tokenHash,
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest
            {
                Email = "invited@example.com",
                InvitationToken = rawToken
            },
            CancellationToken.None);

        EmailOtpChallengeRecord challenge =
            (await challenges.GetByIdAsync(requested.ChallengeId!.Value, CancellationToken.None))!;

        string code = RecoverCodeForTests(challenge);

        EmailOtpVerifyResult verified = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest
            {
                ChallengeId = challenge.Id,
                Code = code,
                InvitationToken = rawToken
            },
            CancellationToken.None);

        Assert.True(verified.Succeeded);
        Assert.Equal(EmailOtpAuthNextStep.Complete, verified.NextStep);

        IReadOnlyList<WorkspaceMembershipRecord> rows =
            await memberships.ListByUserIdAsync(verified.PlatformUserId!.Value, CancellationToken.None);

        Assert.Single(rows);
    }

    [Fact]
    public async Task RequestCodeAsync_returns_neutral_message_when_email_delivery_fails()
    {
        EmailOtpAuthService sut = CreateSut(
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            out Mock<IEmailOtpEmailNotifier> notifier,
            out Mock<IAuditService> audit);

        notifier
            .Setup(n => n.TrySendSignInCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        EmailOtpChallengeRequestResult result = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "fail-send@example.com" },
            CancellationToken.None);

        Assert.Contains("If that address can receive email", result.Message);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt => evt.EventType == AuditEventTypes.EmailOtpSuspiciousBehaviorDetected),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RequestCodeAsync_rate_limits_per_email()
    {
        EmailOtpAuthOptions options = new()
        {
            Enabled = true,
            MaxCodeRequestsPerEmailPerHour = 1,
            ResendCooldownSeconds = 0
        };

        EmailOtpAuthService sut = CreateSut(
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            options);

        EmailOtpChallengeRequestResult first = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "limited@example.com" },
            CancellationToken.None);

        Assert.NotNull(first.ChallengeId);

        EmailOtpChallengeRequestResult second = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "limited@example.com" },
            CancellationToken.None);

        Assert.Null(second.ChallengeId);
    }

    [Fact]
    public async Task VerifyCodeAsync_reuses_existing_email_code_identity()
    {
        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out InMemoryAuthenticationIdentityRepository identityRepo,
            out _,
            out _,
            out _,
            out _,
            out _);

        async Task<Guid> SignInOnceAsync()
        {
            EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
                new EmailOtpChallengeRequest { Email = "existing@example.com" },
                CancellationToken.None);

            EmailOtpChallengeRecord challenge =
                (await challenges.GetByIdAsync(requested.ChallengeId!.Value, CancellationToken.None))!;

            EmailOtpVerifyResult verified = await sut.VerifyCodeAsync(
                new EmailOtpVerifyRequest { ChallengeId = challenge.Id, Code = RecoverCodeForTests(challenge) },
                CancellationToken.None);

            return verified.PlatformUserId!.Value;
        }

        Guid firstUserId = await SignInOnceAsync();
        Guid secondUserId = await SignInOnceAsync();

        Assert.Equal(firstUserId, secondUserId);

        IReadOnlyList<AuthenticationIdentityRecord> identities =
            await identityRepo.ListByUserIdAsync(firstUserId, CancellationToken.None);

        Assert.Single(identities);
    }

    private static string RecoverCodeForTests(EmailOtpChallengeRecord challenge)
    {
        for (int candidate = 0; candidate < 1_000_000; candidate++)
        {
            string code = candidate.ToString("D6", System.Globalization.CultureInfo.InvariantCulture);
            string hash = EmailOtpCodeHasher.Hash(challenge.Id, code, string.Empty);

            if (string.Equals(hash, challenge.CodeHash, StringComparison.Ordinal))
            {
                return code;
            }
        }

        throw new InvalidOperationException("Test helper could not recover OTP code.");
    }
}

internal sealed class InMemoryTenantIdentityProviderConfigurationRepository : ITenantIdentityProviderConfigurationRepository
{
    private readonly Dictionary<Guid, TenantIdentityProviderConfigurationRecord> _byTenant = [];

    public void Seed(TenantIdentityProviderConfigurationRecord record) => _byTenant[record.TenantId] = record;

    public Task<TenantIdentityProviderConfigurationRecord?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byTenant.TryGetValue(tenantId, out TenantIdentityProviderConfigurationRecord? record);

        return Task.FromResult(record);
    }

    public Task UpsertAsync(TenantIdentityProviderConfigurationRecord record, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byTenant[record.TenantId] = record;

        return Task.CompletedTask;
    }
}
