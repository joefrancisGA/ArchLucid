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
            new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
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
            new PermissiveEmailOtpBotChallengeVerifier(Options.Create(opts)),
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
    public async Task VerifyCodeAsync_audits_sso_required_failure_for_stale_challenge_when_domain_now_requires_sso()
    {
        Guid tenantId = Guid.NewGuid();
        const string email = "user@enterprise.example";
        const string code = "123456";

        InMemoryEmailOtpChallengeRepository challenges = new();
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

        Guid challengeId = Guid.NewGuid();
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, code, string.Empty);

        await challenges.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = email,
                CodeHash = codeHash,
                ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(10)
            },
            CancellationToken.None);

        EmailOtpAuthService sut = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 }),
            challenges,
            new EmailOtpSignInDomainPolicyService(
                new AuthSignInRoutingService(
                    signInDomains,
                    new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                    idp,
                    new InMemoryUserInvitationRepository(),
                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
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
            new PermissiveEmailOtpBotChallengeVerifier(Options.Create(new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 })),
            audit.Object,
            TimeProvider.System);

        EmailOtpVerifyResult verified = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest { ChallengeId = challengeId, Code = code },
            CancellationToken.None);

        Assert.False(verified.Succeeded);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt =>
                    evt.EventType == AuditEventTypes.EmailOtpVerificationFailed
                    && evt.DataJson.Contains("sso_required", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
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
            new PermissiveEmailOtpBotChallengeVerifier(Options.Create(new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 })),
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
    public async Task VerifyCodeAsync_accepts_invitation_when_stored_email_casing_differs_from_normalized_sign_in_email()
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
        Guid invitationId = Guid.NewGuid();
        const string rawToken = "invite-token-mixed-case";
        byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(rawToken);
        DateTimeOffset expiresUtc = DateTimeOffset.UtcNow.AddDays(7);

        await invitations.SeedPendingForTestsAsync(
            new UserInvitationRecord
            {
                Id = invitationId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                Email = "Invited@Example.com",
                AppRole = "Reader",
                InvitedByActorId = "admin",
                Status = UserInvitationStatus.Pending,
                CreatedUtc = expiresUtc.AddDays(-1),
                ExpiresUtc = expiresUtc
            },
            tokenHash);

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
    public async Task RequestCodeAsync_audits_recovery_bypass_for_break_glass_admin()
    {
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSignInEmailDomainRepository signInDomains = new();
        InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins = new();
        InMemoryTenantIdentityProviderConfigurationRepository idp = new();

        signInDomains.Seed(new TenantSignInEmailDomainRecord
        {
            TenantId = tenantId,
            DisplayDomain = "enterprise.example",
            NormalizedDomain = "enterprise.example",
            VerificationStatus = AuthDomainVerificationStatus.Verified,
            EnforcementMode = AuthDomainEnforcementMode.SsoRequiredWithRecoveryException,
            RequireEnterpriseSso = true,
            AllowEmailOtpRecovery = true,
            CreatedUtc = DateTimeOffset.UtcNow,
            VerifiedUtc = DateTimeOffset.UtcNow,
            EnforcementEnabledUtc = DateTimeOffset.UtcNow,
            RoutingTestPassedUtc = DateTimeOffset.UtcNow,
            DnsVerificationToken = "verification-token"
        });

        idp.Seed(new TenantIdentityProviderConfigurationRecord
        {
            TenantId = tenantId,
            Protocol = TenantIdentityProtocol.Oidc,
            IssuerUri = "https://login.enterprise.example",
            ClaimMappingJson = "{}",
            UpdatedUtc = DateTimeOffset.UtcNow,
            UpdatedByActorId = "admin",
            IsActive = true
        });

        recoveryAdmins.Seed(new TenantSignInEmailDomainRecoveryAdminRecord
        {
            TenantId = tenantId,
            NormalizedDomain = "enterprise.example",
            NormalizedRecoveryAdminEmail = "breakglass@enterprise.example",
            DisplayRecoveryAdminEmail = "breakglass@enterprise.example",
            CreatedUtc = DateTimeOffset.UtcNow,
            CreatedByActorId = "admin",
            AuthenticationVerifiedUtc = DateTimeOffset.UtcNow
        });

        Mock<IEmailOtpEmailNotifier> notifier = new();
        notifier
            .Setup(n => n.TrySendSignInCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        EmailOtpAuthService sut = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 }),
            new InMemoryEmailOtpChallengeRepository(),
            new EmailOtpSignInDomainPolicyService(
                new AuthSignInRoutingService(
                    signInDomains,
                    recoveryAdmins,
                    idp,
                    new InMemoryUserInvitationRepository(),
                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
                    TimeProvider.System)),
            notifier.Object,
            new PlatformIdentityService(
                new InMemoryPlatformUserRepository(),
                new InMemoryAuthenticationIdentityRepository(),
                new InMemoryWorkspaceMembershipRepository(),
                audit.Object,
                TimeProvider.System),
            new InMemoryAuthenticationIdentityRepository(),
            new InMemoryWorkspaceMembershipRepository(),
            new InMemoryUserInvitationRepository(),
            new PermissiveEmailOtpBotChallengeVerifier(Options.Create(new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 })),
            audit.Object,
            TimeProvider.System);

        EmailOtpChallengeRequestResult result = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = "breakglass@enterprise.example" },
            CancellationToken.None);

        Assert.NotNull(result.ChallengeId);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt => evt.EventType == AuditEventTypes.AuthDomainRecoveryBypassUsed),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
        Assert.Null(result.ChallengeId);
        Assert.NotEqual(false, result.EmailDeliverySucceeded);

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
    public async Task RequestCodeAsync_flood_rate_limits_same_email_burst()
    {
        EmailOtpAuthOptions options = new()
        {
            Enabled = true,
            MaxCodeRequestsPerEmailPerHour = 3,
            MaxCodeRequestsPerIpPerHour = 100,
            ResendCooldownSeconds = 0
        };

        EmailOtpAuthService sut = CreateSut(
            out _,
            out _,
            out _,
            out _,
            out _,
            out _,
            out Mock<IEmailOtpEmailNotifier> notifier,
            out _,
            options);

        int withChallengeId = 0;
        int neutral = 0;
        List<string> messages = [];

        for (int i = 0; i < 12; i++)
        {
            EmailOtpChallengeRequestResult result = await sut.RequestCodeAsync(
                new EmailOtpChallengeRequest
                {
                    Email = "flood-same@example.com",
                    ClientIp = "203.0.113.10"
                },
                CancellationToken.None);

            messages.Add(result.Message);

            if (result.ChallengeId is not null)
            {
                withChallengeId++;
            }
            else
            {
                neutral++;
            }
        }

        Assert.True(withChallengeId <= 3, $"Expected at most 3 challenges, got {withChallengeId}.");
        Assert.True(neutral >= 9, $"Expected majority neutral denials, got {neutral}.");
        Assert.All(messages, message => Assert.DoesNotContain("Exception", message, StringComparison.OrdinalIgnoreCase));
        Assert.All(messages, message => Assert.DoesNotContain("StackTrace", message, StringComparison.OrdinalIgnoreCase));

        notifier.Verify(
            n => n.TrySendSignInCodeAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()),
            Times.AtMost(3));
    }

    [Fact]
    public async Task RequestCodeAsync_flood_rate_limits_shared_ip_across_emails()
    {
        EmailOtpAuthOptions options = new()
        {
            Enabled = true,
            MaxCodeRequestsPerEmailPerHour = 50,
            MaxCodeRequestsPerIpPerHour = 5,
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

        int withChallengeId = 0;
        int neutral = 0;

        for (int i = 0; i < 20; i++)
        {
            EmailOtpChallengeRequestResult result = await sut.RequestCodeAsync(
                new EmailOtpChallengeRequest
                {
                    Email = $"flood-ip-{i}@example.com",
                    ClientIp = "198.51.100.44"
                },
                CancellationToken.None);

            if (result.ChallengeId is not null)
            {
                withChallengeId++;
            }
            else
            {
                neutral++;
            }
        }

        Assert.True(withChallengeId <= 5, $"Expected at most 5 IP-budget challenges, got {withChallengeId}.");
        Assert.True(neutral >= 15, $"Expected IP flood denials, got {neutral}.");
    }

    [Fact]
    public async Task VerifyCodeAsync_returns_invited_workspace_when_user_already_has_older_membership()
    {
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out _,
            out InMemoryWorkspaceMembershipRepository memberships,
            out InMemoryUserInvitationRepository invitations,
            out _,
            out _,
            out _,
            new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 },
            clock);

        Guid tenantId = Guid.NewGuid();
        Guid olderWorkspaceId = Guid.NewGuid();
        Guid newerWorkspaceId = Guid.NewGuid();
        const string email = "member@example.com";

        EmailOtpChallengeRequestResult bootstrap = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = email },
            CancellationToken.None);

        EmailOtpChallengeRecord bootstrapChallenge =
            (await challenges.GetByIdAsync(bootstrap.ChallengeId!.Value, CancellationToken.None))!;

        EmailOtpVerifyResult bootstrapVerified = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest
            {
                ChallengeId = bootstrapChallenge.Id,
                Code = RecoverCodeForTests(bootstrapChallenge)
            },
            CancellationToken.None);

        Guid userId = bootstrapVerified.PlatformUserId!.Value;
        DateTimeOffset olderCreatedUtc = clock.GetUtcNow();

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = tenantId,
                WorkspaceId = olderWorkspaceId,
                Role = "Reader",
                Status = WorkspaceMembershipStatus.Active
            },
            olderCreatedUtc,
            CancellationToken.None);

        clock.Advance(TimeSpan.FromDays(30));

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = tenantId,
                WorkspaceId = newerWorkspaceId,
                Role = "Reader",
                Status = WorkspaceMembershipStatus.Active
            },
            clock.GetUtcNow(),
            CancellationToken.None);

        const string rawToken = "reinvite-older-workspace";
        byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(rawToken);

        await invitations.InsertAsync(
            tenantId,
            olderWorkspaceId,
            email,
            "Reader",
            "admin",
            null,
            tokenHash,
            clock.GetUtcNow().AddDays(7),
            CancellationToken.None);

        EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest
            {
                Email = email,
                InvitationToken = rawToken
            },
            CancellationToken.None);

        EmailOtpChallengeRecord challenge =
            (await challenges.GetByIdAsync(requested.ChallengeId!.Value, CancellationToken.None))!;

        EmailOtpVerifyResult verified = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest
            {
                ChallengeId = challenge.Id,
                Code = RecoverCodeForTests(challenge),
                InvitationToken = rawToken
            },
            CancellationToken.None);

        Assert.True(verified.Succeeded);
        Assert.Equal(EmailOtpAuthNextStep.Complete, verified.NextStep);
        Assert.Equal(olderWorkspaceId, verified.WorkspaceId);
    }

    [Fact]
    public async Task VerifyCodeAsync_selects_workspace_when_challenge_invitation_is_not_accepted()
    {
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out _,
            out InMemoryWorkspaceMembershipRepository memberships,
            out InMemoryUserInvitationRepository invitations,
            out _,
            out _,
            out _,
            new EmailOtpAuthOptions
            {
                Enabled = true,
                ResendCooldownSeconds = 0,
                CodeLifetimeMinutes = 30
            },
            clock);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceA = Guid.NewGuid();
        Guid workspaceB = Guid.NewGuid();
        const string email = "multi@example.com";
        const string rawToken = "expired-invite-token";
        byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(rawToken);

        EmailOtpChallengeRequestResult bootstrap = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest { Email = email },
            CancellationToken.None);

        EmailOtpChallengeRecord bootstrapChallenge =
            (await challenges.GetByIdAsync(bootstrap.ChallengeId!.Value, CancellationToken.None))!;

        EmailOtpVerifyResult bootstrapVerified = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest
            {
                ChallengeId = bootstrapChallenge.Id,
                Code = RecoverCodeForTests(bootstrapChallenge)
            },
            CancellationToken.None);

        Guid userId = bootstrapVerified.PlatformUserId!.Value;
        DateTimeOffset createdUtc = clock.GetUtcNow();

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = tenantId,
                WorkspaceId = workspaceA,
                Role = "Reader",
                Status = WorkspaceMembershipStatus.Active
            },
            createdUtc,
            CancellationToken.None);

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = tenantId,
                WorkspaceId = workspaceB,
                Role = "Reader",
                Status = WorkspaceMembershipStatus.Active
            },
            createdUtc.AddMinutes(1),
            CancellationToken.None);

        Guid invitationId = Guid.NewGuid();
        DateTimeOffset expiresUtc = clock.GetUtcNow().AddMinutes(5);

        await invitations.SeedPendingForTestsAsync(
            new UserInvitationRecord
            {
                Id = invitationId,
                TenantId = tenantId,
                WorkspaceId = workspaceA,
                Email = email,
                AppRole = "Reader",
                InvitedByActorId = "admin",
                Status = UserInvitationStatus.Pending,
                CreatedUtc = expiresUtc.AddDays(-1),
                ExpiresUtc = expiresUtc
            },
            tokenHash);

        clock.Advance(TimeSpan.FromMinutes(1));

        EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
            new EmailOtpChallengeRequest
            {
                Email = email,
                InvitationToken = rawToken
            },
            CancellationToken.None);

        Assert.NotNull(requested.ChallengeId);

        clock.Advance(TimeSpan.FromMinutes(6));

        EmailOtpChallengeRecord challenge =
            (await challenges.GetByIdAsync(requested.ChallengeId!.Value, CancellationToken.None))!;

        EmailOtpVerifyResult verified = await sut.VerifyCodeAsync(
            new EmailOtpVerifyRequest
            {
                ChallengeId = challenge.Id,
                Code = RecoverCodeForTests(challenge)
            },
            CancellationToken.None);

        Assert.True(verified.Succeeded);
        Assert.Equal(EmailOtpAuthNextStep.SelectWorkspace, verified.NextStep);
        Assert.Null(verified.WorkspaceId);
    }

    [Fact]
    public async Task VerifyCodeAsync_reuses_existing_email_code_identity()
    {
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        EmailOtpAuthOptions options = new()
        {
            Enabled = true,
            ResendCooldownSeconds = 0,
            MaxCodeRequestsPerEmailPerHour = 10
        };

        EmailOtpAuthService sut = CreateSut(
            out InMemoryEmailOtpChallengeRepository challenges,
            out _,
            out InMemoryAuthenticationIdentityRepository identityRepo,
            out _,
            out _,
            out _,
            out _,
            out _,
            options,
            clock);

        async Task<Guid> SignInOnceAsync()
        {
            EmailOtpChallengeRequestResult requested = await sut.RequestCodeAsync(
                new EmailOtpChallengeRequest { Email = "existing@example.com" },
                CancellationToken.None);

            Assert.NotNull(requested.ChallengeId);

            EmailOtpChallengeRecord challenge =
                (await challenges.GetByIdAsync(requested.ChallengeId!.Value, CancellationToken.None))!;

            EmailOtpVerifyResult verified = await sut.VerifyCodeAsync(
                new EmailOtpVerifyRequest { ChallengeId = challenge.Id, Code = RecoverCodeForTests(challenge) },
                CancellationToken.None);

            return verified.PlatformUserId!.Value;
        }

        Guid firstUserId = await SignInOnceAsync();
        clock.Advance(TimeSpan.FromMinutes(1));
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
