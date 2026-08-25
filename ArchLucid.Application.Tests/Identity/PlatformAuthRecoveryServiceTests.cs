using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class PlatformAuthRecoveryServiceTests
{
    [Fact]
    public async Task GrantTemporaryRecoveryAccessAsync_creates_time_limited_grant_and_audits()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSignInEmailDomainRepository domains = new();
        InMemoryPlatformTenantAuthRecoveryGrantRepository grants = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
        Mock<IAuditService> audit = new();

        domains.Seed(new TenantSignInEmailDomainRecord
        {
            TenantId = tenantId,
            DisplayDomain = "enterprise.example",
            NormalizedDomain = "enterprise.example",
            VerificationStatus = AuthDomainVerificationStatus.Verified,
            EnforcementMode = AuthDomainEnforcementMode.SsoRequiredWithRecoveryException,
            DnsVerificationToken = "token",
            RequireEnterpriseSso = true,
            AllowEmailOtpRecovery = true,
            CreatedUtc = clock.GetUtcNow(),
            VerifiedUtc = clock.GetUtcNow(),
            EnforcementEnabledUtc = clock.GetUtcNow(),
            RoutingTestPassedUtc = clock.GetUtcNow(),
            UpdatedUtc = clock.GetUtcNow()
        });

        PlatformAuthRecoveryService sut = new(
            grants,
            domains,
            new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
            new PlatformRecoveryNotificationService(audit.Object),
            audit.Object,
            clock);

        PlatformAuthRecoveryGrantView view = await sut.GrantTemporaryRecoveryAccessAsync(
            new PlatformAuthRecoveryGrantRequest
            {
                TenantId = tenantId,
                NormalizedDomain = "enterprise.example",
                Reason = "Tenant IdP misconfiguration blocking all administrators from signing in.",
                EvidenceReference = "support-ticket-12345",
                DurationHours = 4
            },
            "platform-operator",
            CancellationToken.None);

        Assert.True(view.IsActive);
        Assert.Equal(tenantId, view.TenantId);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt =>
                    evt.EventType == AuditEventTypes.PlatformTenantAuthRecoveryGranted
                    && evt.ExplicitActor),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetGrantAsync_returns_inactive_after_expiration()
    {
        FakeTimeProvider clock = new(DateTimeOffset.Parse("2026-07-16T12:00:00Z", null, System.Globalization.DateTimeStyles.RoundtripKind));
        InMemoryPlatformTenantAuthRecoveryGrantRepository grants = new();
        Guid grantId = Guid.NewGuid();

        await grants.InsertAsync(
            new PlatformTenantAuthRecoveryGrantRecord
            {
                GrantId = grantId,
                TenantId = Guid.NewGuid(),
                NormalizedDomain = "enterprise.example",
                Reason = "Expired grant test case with sufficient detail.",
                EvidenceReference = "ticket-1",
                GrantedByActorId = "operator",
                GrantedUtc = clock.GetUtcNow().AddHours(-5),
                ExpiresUtc = clock.GetUtcNow().AddHours(-1)
            },
            CancellationToken.None);

        PlatformAuthRecoveryService sut = new(
            grants,
            new InMemoryTenantSignInEmailDomainRepository(),
            new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
            new PlatformRecoveryNotificationService(Mock.Of<IAuditService>()),
            Mock.Of<IAuditService>(),
            clock);

        PlatformAuthRecoveryGrantView? view = await sut.GetGrantAsync(grantId, CancellationToken.None);

        Assert.NotNull(view);
        Assert.False(view!.IsActive);
    }

    [Fact]
    public async Task EvaluateAsync_allows_email_code_when_platform_grant_active()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSignInEmailDomainRepository domains = new();
        InMemoryTenantIdentityProviderConfigurationRepository idpConfigs = new();
        InMemoryPlatformTenantAuthRecoveryGrantRepository grants = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        domains.Seed(new TenantSignInEmailDomainRecord
        {
            TenantId = tenantId,
            DisplayDomain = "enterprise.example",
            NormalizedDomain = "enterprise.example",
            VerificationStatus = AuthDomainVerificationStatus.Verified,
            EnforcementMode = AuthDomainEnforcementMode.SsoRequiredForVerifiedDomain,
            DnsVerificationToken = "token",
            RequireEnterpriseSso = true,
            AllowEmailOtpRecovery = false,
            CreatedUtc = clock.GetUtcNow(),
            VerifiedUtc = clock.GetUtcNow(),
            EnforcementEnabledUtc = clock.GetUtcNow(),
            RoutingTestPassedUtc = clock.GetUtcNow(),
            UpdatedUtc = clock.GetUtcNow()
        });

        idpConfigs.Seed(new TenantIdentityProviderConfigurationRecord
        {
            TenantId = tenantId,
            Protocol = TenantIdentityProtocol.Oidc,
            IssuerUri = "https://login.enterprise.example",
            ClaimMappingJson = "{}",
            UpdatedUtc = clock.GetUtcNow(),
            UpdatedByActorId = "admin",
            IsActive = true
        });

        await grants.InsertAsync(
            new PlatformTenantAuthRecoveryGrantRecord
            {
                GrantId = Guid.NewGuid(),
                TenantId = tenantId,
                NormalizedDomain = "enterprise.example",
                Reason = "Platform-assisted recovery for locked tenant administrators.",
                EvidenceReference = "ticket-99",
                GrantedByActorId = "operator",
                GrantedUtc = clock.GetUtcNow(),
                ExpiresUtc = clock.GetUtcNow().AddHours(2)
            },
            CancellationToken.None);

        AuthSignInRoutingService routing = new(
            domains,
            new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
            idpConfigs,
            new InMemoryUserInvitationRepository(),
            grants,
            clock);

        AuthSignInRoutingEvaluation evaluation = await routing.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "user@enterprise.example" },
            CancellationToken.None);

        Assert.True(evaluation.AllowEmailCode);
        Assert.Equal(AuthSignInRoutingBypassKind.PlatformGrant, evaluation.BypassKind);
    }
}
