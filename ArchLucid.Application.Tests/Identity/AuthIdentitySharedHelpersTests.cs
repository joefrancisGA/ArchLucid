using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class AuthAuditEmitterTests
{
    [Fact]
    public void Create_serializes_payload_and_sets_actor_fields()
    {
        AuditEvent auditEvent = AuthAuditEmitter.Create(
            AuditEventTypes.EmailOtpCodeRequested,
            "actor@test",
            new { scope = "email_request_hourly" },
            tenantId: Guid.Parse("11111111-1111-1111-1111-111111111111"),
            explicitActor: true);

        auditEvent.EventType.Should().Be(AuditEventTypes.EmailOtpCodeRequested);
        auditEvent.ActorUserId.Should().Be("actor@test");
        auditEvent.ActorUserName.Should().Be("actor@test");
        auditEvent.ExplicitActor.Should().BeTrue();
        auditEvent.TenantId.Should().Be(Guid.Parse("11111111-1111-1111-1111-111111111111"));
        auditEvent.DataJson.Should().Contain("email_request_hourly");
    }

    [Fact]
    public async Task LogIdentityEventAsync_delegates_to_audit_service()
    {
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        await AuthAuditEmitter.LogIdentityEventAsync(
            audit.Object,
            AuditEventTypes.EmailOtpVerificationFailed,
            "correlation",
            new { reason = "invalid_code" },
            CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(row =>
                    row.EventType == AuditEventTypes.EmailOtpVerificationFailed
                    && row.ActorUserId == "correlation"
                    && row.ExplicitActor),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}

[Trait("Category", "Unit")]
public sealed class AuthRateLimitHelperTests
{
    [Fact]
    public async Task IsEmailOtpRequestRateLimitedAsync_returns_true_when_email_limit_exceeded()
    {
        InMemoryEmailOtpChallengeRepository challenges = new();
        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        EmailOtpAuthOptions options = new()
        {
            MaxCodeRequestsPerEmailPerHour = 1
        };

        DateTimeOffset now = DateTimeOffset.UtcNow;

        await challenges.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = Guid.NewGuid(),
                NormalizedEmail = "user@example.com",
                CodeHash = "hash",
                ExpiresUtc = now.AddMinutes(10)
            },
            CancellationToken.None);

        bool limited = await AuthRateLimitHelper.IsEmailOtpRequestRateLimitedAsync(
            challenges,
            options,
            "user@example.com",
            clientIp: "203.0.113.10",
            now,
            emailCorrelation: "corr",
            audit.Object,
            CancellationToken.None);

        limited.Should().BeTrue();

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(row => row.EventType == AuditEventTypes.EmailOtpRateLimitTriggered),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task IsEmailOtpVerificationRateLimitedAsync_returns_false_when_under_threshold()
    {
        InMemoryEmailOtpChallengeRepository challenges = new();
        Mock<IAuditService> audit = new();

        bool limited = await AuthRateLimitHelper.IsEmailOtpVerificationRateLimitedAsync(
            challenges,
            new EmailOtpAuthOptions { MaxVerificationAttemptsPerEmailPerHour = 3 },
            "user@example.com",
            DateTimeOffset.UtcNow,
            "corr",
            audit.Object,
            CancellationToken.None);

        limited.Should().BeFalse();
        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}

[Trait("Category", "Unit")]
public sealed class AuthValidationResultMapperTests
{
    [Fact]
    public void ToPostAuthCreateWorkspaceDeny_maps_customer_message()
    {
        PostAuthCreateWorkspaceResult result = AuthValidationResultMapper.ToPostAuthCreateWorkspaceDeny(
            AuthValidationResult.Invalid("Denied", "active_trial"));

        result.Succeeded.Should().BeFalse();
        result.CustomerMessage.Should().Be("Denied");
    }

    [Theory]
    [InlineData(EmailOtpChallengeCompletionResult.Expired, "expired")]
    [InlineData(EmailOtpChallengeCompletionResult.TooManyAttempts, "too_many_attempts")]
    [InlineData(EmailOtpChallengeCompletionResult.AlreadyCompleted, "reused")]
    [InlineData(EmailOtpChallengeCompletionResult.InvalidCode, "invalid_code")]
    [InlineData(EmailOtpChallengeCompletionResult.NotFound, "invalid")]
    public void MapEmailOtpCompletionFailureReason_maps_known_outcomes(
        EmailOtpChallengeCompletionResult completionResult,
        string expectedReason)
    {
        AuthValidationResultMapper.MapEmailOtpCompletionFailureReason(completionResult)
            .Should()
            .Be(expectedReason);
    }

    [Theory]
    [InlineData("expired", "expired")]
    [InlineData("too_many_attempts", "rate_limited")]
    [InlineData("sso_required", "sso_required")]
    [InlineData("invalid_code", "invalid")]
    public void MapEmailOtpVerifyMetricResult_maps_metric_labels(string reason, string expectedMetric)
    {
        AuthValidationResultMapper.MapEmailOtpVerifyMetricResult(reason).Should().Be(expectedMetric);
    }
}
