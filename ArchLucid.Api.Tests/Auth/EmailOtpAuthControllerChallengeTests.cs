using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Controllers.Auth;
using ArchLucid.Api.Models.Auth;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

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
                new AuthSignInRoutingService(
                    new InMemoryTenantSignInEmailDomainRepository(),
                    new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                    new InMemoryTenantIdentityProviderConfigurationRepository(),
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
}

internal sealed class InMemoryTenantIdentityProviderConfigurationRepository : ITenantIdentityProviderConfigurationRepository
{
    private readonly Dictionary<Guid, TenantIdentityProviderConfigurationRecord> _byTenant = [];

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
