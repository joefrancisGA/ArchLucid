using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Controllers.Auth;
using ArchLucid.Api.Models.Auth;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Security;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EmailOtpAuthControllerVerifyTests
{
    [Fact]
    public async Task VerifyAsync_response_scope_matches_jwt_when_service_returns_null_tenant_workspace()
    {
        Guid userId = Guid.NewGuid();
        Guid challengeId = Guid.NewGuid();
        Guid authVersion = Guid.NewGuid();
        (Guid defaultTenantId, Guid defaultWorkspaceId, Guid defaultProjectId) = TrialLocalJwtScopeDefaults.Resolve();

        Mock<IEmailOtpAuthService> emailOtpAuth = new();
        emailOtpAuth
            .Setup(service => service.VerifyCodeAsync(It.IsAny<Application.Identity.EmailOtpVerifyRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new EmailOtpVerifyResult
                {
                    Succeeded = true,
                    PlatformUserId = userId,
                    DisplayEmail = "new.user@example.com",
                    Role = "Reader",
                    NextStep = EmailOtpAuthNextStep.CreateWorkspace,
                    TenantId = null,
                    WorkspaceId = null,
                    AuthVersion = authVersion
                });

        Guid capturedTenantId = Guid.Empty;
        Guid capturedWorkspaceId = Guid.Empty;
        Guid capturedProjectId = Guid.Empty;

        Mock<ILocalTrialJwtIssuer> jwtIssuer = new();
        jwtIssuer
            .Setup(issuer => issuer.IssueAccessToken(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid?>()))
            .Callback<Guid, string, string, Guid, Guid, Guid, Guid?>(
                (_, _, _, tenantId, workspaceId, projectId, _) =>
                {
                    capturedTenantId = tenantId;
                    capturedWorkspaceId = workspaceId;
                    capturedProjectId = projectId;
                })
            .Returns("signed-jwt");

        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        EmailOtpAuthController controller = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true, AccessTokenLifetimeMinutes = 60 }),
            emailOtpAuth.Object,
            jwtIssuer.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult actionResult = await controller.VerifyAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpVerifyRequest
            {
                ChallengeId = challengeId,
                Code = "123456"
            },
            CancellationToken.None);

        OkObjectResult ok = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        EmailOtpVerifyResponse response = ok.Value.Should().BeOfType<EmailOtpVerifyResponse>().Subject;

        capturedTenantId.Should().Be(defaultTenantId);
        capturedWorkspaceId.Should().Be(defaultWorkspaceId);
        capturedProjectId.Should().Be(defaultProjectId);
        response.TenantId.Should().Be(defaultTenantId);
        response.WorkspaceId.Should().Be(defaultWorkspaceId);
    }

    [Fact]
    public async Task VerifyAsync_does_not_log_email_otp_code_requested_audit()
    {
        Guid challengeId = Guid.NewGuid();

        Mock<IEmailOtpAuthService> emailOtpAuth = new();
        emailOtpAuth
            .Setup(service => service.VerifyCodeAsync(It.IsAny<Application.Identity.EmailOtpVerifyRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(AuthValidationResultMapper.ToEmailOtpVerifyFailure());

        Mock<ILocalTrialJwtIssuer> jwtIssuer = new();

        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        EmailOtpAuthController controller = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true }),
            emailOtpAuth.Object,
            jwtIssuer.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        await controller.VerifyAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpVerifyRequest
            {
                ChallengeId = challengeId,
                Code = "000000"
            },
            CancellationToken.None);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt => evt.EventType == AuditEventTypes.EmailOtpCodeRequested),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
