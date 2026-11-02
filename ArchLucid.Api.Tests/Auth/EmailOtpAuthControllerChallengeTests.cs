using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Controllers.Auth;
using ArchLucid.Api.Models.Auth;
using ArchLucid.Application.Identity;
using ArchLucid.Application.Tests.Identity;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using IdpConfigStore = ArchLucid.Persistence.Identity.InMemoryTenantIdentityProviderConfigurationRepository;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Auth;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EmailOtpAuthControllerChallengeTests
{
    [Fact]
    public async Task RequestChallengeAsync_logs_email_otp_code_requested_once_for_valid_email()
    {
        List<AuditEvent> auditEvents = [];

        Mock<IAuditService> audit = new();
        audit
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => auditEvents.Add(auditEvent))
            .Returns(Task.CompletedTask);

        Mock<IEmailOtpEmailNotifier> notifier = new();
        notifier
            .Setup(n => n.TrySendSignInCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        EmailOtpAuthOptions options = new() { Enabled = true, ResendCooldownSeconds = 0 };

        EmailOtpAuthService emailOtpAuth = new(
            Options.Create(options),
            new InMemoryEmailOtpChallengeRepository(),
            new EmailOtpSignInDomainPolicyService(
                AuthSignInRoutingServiceTestSupport.Create(
                    new InMemoryTenantSignInEmailDomainRepository(),
                    new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                    new IdpConfigStore(),
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
            new PermissiveEmailOtpBotChallengeVerifier(Options.Create(options)),
            audit.Object,
            TimeProvider.System);

        EmailOtpAuthController controller = new(
            Options.Create(options),
            emailOtpAuth,
            Mock.Of<ILocalTrialJwtIssuer>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult actionResult = await controller.RequestChallengeAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest { Email = "user@example.com" },
            CancellationToken.None);

        actionResult.Should().BeOfType<OkObjectResult>();

        auditEvents
            .Count(evt => evt.EventType == AuditEventTypes.EmailOtpCodeRequested)
            .Should()
            .Be(1);
    }

    [Fact]
    public async Task RequestChallengeAsync_returns_bad_request_when_body_is_null()
    {
        EmailOtpAuthController controller = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true }),
            Mock.Of<IEmailOtpAuthService>(),
            Mock.Of<ILocalTrialJwtIssuer>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult actionResult = await controller.RequestChallengeAsync(
            body: null,
            CancellationToken.None);

        ObjectResult badRequest = actionResult.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RequestChallengeAsync_returns_not_found_when_otp_auth_is_disabled()
    {
        EmailOtpAuthController controller = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = false }),
            Mock.Of<IEmailOtpAuthService>(),
            Mock.Of<ILocalTrialJwtIssuer>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult actionResult = await controller.RequestChallengeAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest { Email = "user@example.com" },
            CancellationToken.None);

        ObjectResult notFound = actionResult.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task RequestChallengeAsync_returns_bad_request_when_email_is_null()
    {
        EmailOtpAuthController controller = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true }),
            Mock.Of<IEmailOtpAuthService>(),
            Mock.Of<ILocalTrialJwtIssuer>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult actionResult = await controller.RequestChallengeAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest { Email = null! },
            CancellationToken.None);

        ObjectResult badRequest = actionResult.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RequestChallengeAsync_omits_challenge_id_when_email_delivery_failed()
    {
        Guid leakedChallengeId = Guid.NewGuid();

        Mock<IEmailOtpAuthService> emailOtpAuth = new();
        emailOtpAuth
            .Setup(service => service.RequestCodeAsync(
                It.IsAny<Application.Identity.EmailOtpChallengeRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new EmailOtpChallengeRequestResult
                {
                    Message = "If that address can receive email, we sent a sign-in code.",
                    ChallengeId = leakedChallengeId,
                    EmailDeliverySucceeded = false
                });

        EmailOtpAuthController controller = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true }),
            emailOtpAuth.Object,
            Mock.Of<ILocalTrialJwtIssuer>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult actionResult = await controller.RequestChallengeAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest { Email = "user@example.com" },
            CancellationToken.None);

        OkObjectResult ok = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        EmailOtpChallengeResponse body = ok.Value.Should().BeOfType<EmailOtpChallengeResponse>().Subject;

        body.ChallengeId.Should().BeNull();
        body.EmailDeliverySucceeded.Should().BeFalse();
    }

    [Fact]
    public async Task RequestChallengeAsync_delivery_failure_api_envelope_matches_for_unknown_and_existing_user_emails()
    {
        Mock<IEmailOtpEmailNotifier> notifier = new();
        notifier
            .Setup(n => n.TrySendSignInCodeAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        EmailOtpAuthOptions options = new() { Enabled = true, ResendCooldownSeconds = 0 };

        InMemoryPlatformUserRepository users = new();
        await users.InsertAsync(
            new PlatformUserInsert
            {
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                PrimaryEmail = "existing@example.com",
                NormalizedPrimaryEmail = "existing@example.com",
            },
            CancellationToken.None);

        EmailOtpAuthService emailOtpAuth = new(
            Options.Create(options),
            new InMemoryEmailOtpChallengeRepository(),
            new EmailOtpSignInDomainPolicyService(
                AuthSignInRoutingServiceTestSupport.Create(
                    new InMemoryTenantSignInEmailDomainRepository(),
                    new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                    new IdpConfigStore(),
                    new InMemoryUserInvitationRepository(),
                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
                    TimeProvider.System)),
            notifier.Object,
            new PlatformIdentityService(
                users,
                new InMemoryAuthenticationIdentityRepository(),
                new InMemoryWorkspaceMembershipRepository(),
                Mock.Of<IAuditService>(),
                TimeProvider.System),
            new InMemoryAuthenticationIdentityRepository(),
            new InMemoryWorkspaceMembershipRepository(),
            new InMemoryUserInvitationRepository(),
            new PermissiveEmailOtpBotChallengeVerifier(Options.Create(options)),
            Mock.Of<IAuditService>(),
            TimeProvider.System);

        EmailOtpAuthController controller = new(
            Options.Create(options),
            emailOtpAuth,
            Mock.Of<ILocalTrialJwtIssuer>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        OkObjectResult unknownResult = (OkObjectResult)await controller.RequestChallengeAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest { Email = "never-seen@example.com" },
            CancellationToken.None);

        OkObjectResult existingResult = (OkObjectResult)await controller.RequestChallengeAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest { Email = "existing@example.com" },
            CancellationToken.None);

        EmailOtpChallengeResponse unknownBody = unknownResult.Value.Should().BeOfType<EmailOtpChallengeResponse>().Subject;
        EmailOtpChallengeResponse existingBody = existingResult.Value.Should().BeOfType<EmailOtpChallengeResponse>().Subject;

        unknownBody.Message.Should().Be(existingBody.Message);
        unknownBody.ChallengeId.Should().BeNull();
        existingBody.ChallengeId.Should().BeNull();
        unknownBody.EmailDeliverySucceeded.Should().BeFalse();
        existingBody.EmailDeliverySucceeded.Should().BeFalse();
        unknownBody.SsoRequired.Should().Be(existingBody.SsoRequired);
    }

    [Fact]
    public async Task RequestChallengeAsync_omits_challenge_id_when_email_delivery_succeeded_is_null_without_challenge()
    {
        Mock<IEmailOtpAuthService> emailOtpAuth = new();
        emailOtpAuth
            .Setup(service => service.RequestCodeAsync(
                It.IsAny<Application.Identity.EmailOtpChallengeRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new EmailOtpChallengeRequestResult
                {
                    Message = "If that address can receive email, we sent a sign-in code.",
                    EmailDeliverySucceeded = null
                });

        EmailOtpAuthController controller = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true }),
            emailOtpAuth.Object,
            Mock.Of<ILocalTrialJwtIssuer>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult actionResult = await controller.RequestChallengeAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest { Email = "user@example.com" },
            CancellationToken.None);

        OkObjectResult ok = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        EmailOtpChallengeResponse body = ok.Value.Should().BeOfType<EmailOtpChallengeResponse>().Subject;

        body.ChallengeId.Should().BeNull();
        body.EmailDeliverySucceeded.Should().BeNull();
    }

    [Fact]
    public async Task RequestChallengeAsync_treats_null_email_delivery_succeeded_as_distinct_from_explicit_failure()
    {
        Guid challengeId = Guid.NewGuid();

        Mock<IEmailOtpAuthService> emailOtpAuth = new();
        emailOtpAuth
            .Setup(service => service.RequestCodeAsync(
                It.IsAny<Application.Identity.EmailOtpChallengeRequest>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new EmailOtpChallengeRequestResult
                {
                    Message = "If that address can receive email, we sent a sign-in code.",
                    ChallengeId = challengeId,
                    EmailDeliverySucceeded = null
                });

        EmailOtpAuthController controller = new(
            Options.Create(new EmailOtpAuthOptions { Enabled = true }),
            emailOtpAuth.Object,
            Mock.Of<ILocalTrialJwtIssuer>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };

        IActionResult actionResult = await controller.RequestChallengeAsync(
            new ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest { Email = "user@example.com" },
            CancellationToken.None);

        OkObjectResult ok = actionResult.Should().BeOfType<OkObjectResult>().Subject;
        EmailOtpChallengeResponse body = ok.Value.Should().BeOfType<EmailOtpChallengeResponse>().Subject;

        body.ChallengeId.Should().Be(challengeId);
        body.EmailDeliverySucceeded.Should().BeNull();
    }
}
