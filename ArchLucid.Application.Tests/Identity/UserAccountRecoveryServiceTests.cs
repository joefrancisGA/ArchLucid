using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class UserAccountRecoveryServiceTests
{
    [Fact]
    public async Task ChangePrimaryEmailAsync_rejects_when_verification_rate_limited()
    {
        InMemoryEmailOtpChallengeRepository challenges = new();
        InMemoryPlatformUserRepository users = new();
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        EmailOtpAuthOptions options = new() { MaxVerificationAttemptsPerEmailPerHour = 1 };

        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = "old@example.com",
                NormalizedPrimaryEmail = "old@example.com",
                DisplayName = "User",
                Status = PlatformUserStatus.Active
            },
            CancellationToken.None);

        Guid challengeId = Guid.NewGuid();
        DateTimeOffset now = clock.GetUtcNow();

        await challenges.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = "new@example.com",
                CodeHash = EmailOtpCodeHasher.Hash(challengeId, "123456", options.HashPepper),
                ExpiresUtc = now.AddMinutes(10)
            },
            CancellationToken.None);

        await challenges.TryCompleteAsync(
            challengeId,
            "wrong-hash",
            now,
            maxFailedAttempts: 10,
            CancellationToken.None);

        UserAccountRecoveryService sut = new(
            users,
            challenges,
            Options.Create(options),
            audit.Object,
            clock);

        Func<Task> act = () => sut.ChangePrimaryEmailAsync(
            user.Id,
            new UserAccountPrimaryEmailChangeRequest { ChallengeId = challengeId, Code = "123456" },
            "user-actor",
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Invalid or expired verification code.");

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(row => row.EventType == AuditEventTypes.EmailOtpRateLimitTriggered),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ChangePrimaryEmailAsync_emits_identity_audit_events_on_success()
    {
        InMemoryEmailOtpChallengeRepository challenges = new();
        InMemoryPlatformUserRepository users = new();
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        EmailOtpAuthOptions options = new();

        PlatformUserRecord user = await users.InsertAsync(
            new PlatformUserInsert
            {
                PrimaryEmail = "old@example.com",
                NormalizedPrimaryEmail = "old@example.com",
                DisplayName = "User",
                Status = PlatformUserStatus.Active
            },
            CancellationToken.None);

        Guid challengeId = Guid.NewGuid();
        string code = "654321";
        DateTimeOffset now = clock.GetUtcNow();

        await challenges.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = "new@example.com",
                CodeHash = EmailOtpCodeHasher.Hash(challengeId, code, options.HashPepper),
                ExpiresUtc = now.AddMinutes(10)
            },
            CancellationToken.None);

        UserAccountRecoveryService sut = new(
            users,
            challenges,
            Options.Create(options),
            audit.Object,
            clock);

        await sut.ChangePrimaryEmailAsync(
            user.Id,
            new UserAccountPrimaryEmailChangeRequest { ChallengeId = challengeId, Code = code },
            "user-actor",
            CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(row =>
                    row.EventType == AuditEventTypes.UserAccountPrimaryEmailChangeRequested
                    && row.ExplicitActor),
                It.IsAny<CancellationToken>()),
            Times.Once);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(row =>
                    row.EventType == AuditEventTypes.UserAccountPrimaryEmailChanged
                    && row.ExplicitActor),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}

[Trait("Category", "Unit")]
public sealed class EmailOtpRequestFlowTests
{
    [Fact]
    public async Task ExecuteAsync_returns_neutral_result_when_disabled()
    {
        InMemoryEmailOtpChallengeRepository challenges = new();
        Mock<IAuditService> audit = new();

        EmailOtpRequestFlow sut = new(
            new EmailOtpAuthOptions { Enabled = false },
            challenges,
            Mock.Of<IEmailOtpSignInDomainPolicyService>(),
            Mock.Of<IEmailOtpEmailNotifier>(),
            new InMemoryUserInvitationRepository(),
            new PermissiveEmailOtpBotChallengeVerifier(Options.Create(new EmailOtpAuthOptions())),
            audit.Object,
            TimeProvider.System);

        EmailOtpChallengeRequestResult result = await sut.ExecuteAsync(
            new EmailOtpChallengeRequest { Email = "user@example.com" },
            CancellationToken.None);

        result.ChallengeId.Should().BeNull();
        result.Message.Should().Contain("sign-in code");

        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_audits_code_requested_for_valid_email()
    {
        InMemoryEmailOtpChallengeRepository challenges = new();
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IEmailOtpSignInDomainPolicyService> domainPolicy = new();
        domainPolicy
            .Setup(service => service.EvaluateAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EmailOtpSignInDomainEvaluation { Decision = EmailOtpSignInDomainDecision.AllowEmailOtp });

        Mock<IEmailOtpEmailNotifier> notifier = new();
        notifier
            .Setup(service => service.TrySendSignInCodeAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        EmailOtpRequestFlow sut = new(
            new EmailOtpAuthOptions { Enabled = true, ResendCooldownSeconds = 0 },
            challenges,
            domainPolicy.Object,
            notifier.Object,
            new InMemoryUserInvitationRepository(),
            new PermissiveEmailOtpBotChallengeVerifier(Options.Create(new EmailOtpAuthOptions())),
            audit.Object,
            TimeProvider.System);

        EmailOtpChallengeRequestResult result = await sut.ExecuteAsync(
            new EmailOtpChallengeRequest { Email = "user@example.com" },
            CancellationToken.None);

        result.ChallengeId.Should().NotBeNull();
        result.EmailDeliverySucceeded.Should().BeTrue();

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(row =>
                    row.EventType == AuditEventTypes.EmailOtpCodeRequested
                    && row.ExplicitActor),
                It.IsAny<CancellationToken>()),
            Times.Once);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(row => row.EventType == AuditEventTypes.EmailOtpCodeSent),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
