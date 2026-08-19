using ArchLucid.Application.Identity;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class AuthSignInRoutingServiceTests
{
    private static AuthSignInRoutingService CreateSut(
        out InMemoryTenantSignInEmailDomainRepository domains,
        out InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
        out InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
        out InMemoryUserInvitationRepository invitations)
    {
        domains = new InMemoryTenantSignInEmailDomainRepository();
        recoveryAdmins = new InMemoryTenantSignInEmailDomainRecoveryAdminRepository();
        idpConfigs = new InMemoryTenantIdentityProviderConfigurationRepository();
        invitations = new InMemoryUserInvitationRepository();

        return new AuthSignInRoutingService(
            domains,
            recoveryAdmins,
            idpConfigs,
            invitations,
            new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
            TimeProvider.System);
    }

    private static TenantSignInEmailDomainRecord EnforcedDomain(Guid tenantId, string domain) =>
        new()
        {
            TenantId = tenantId,
            DisplayDomain = domain,
            NormalizedDomain = domain,
            VerificationStatus = AuthDomainVerificationStatus.Verified,
            EnforcementMode = AuthDomainEnforcementMode.SsoRequiredForVerifiedDomain,
            RequireEnterpriseSso = true,
            CreatedUtc = DateTimeOffset.UtcNow,
            VerifiedUtc = DateTimeOffset.UtcNow,
            RoutingTestPassedUtc = DateTimeOffset.UtcNow,
            EnforcementEnabledUtc = DateTimeOffset.UtcNow,
            DnsVerificationToken = "token"
        };

    [Fact]
    public async Task EvaluateAsync_allows_email_code_for_unknown_domain()
    {
        AuthSignInRoutingService sut = CreateSut(out _, out _, out _, out _);

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "user@unknown.example", ReturnPath = "/runs" },
            CancellationToken.None);

        Assert.True(result.AllowEmailCode);
        Assert.False(result.SsoRequired);
        Assert.Equal("/runs", result.SafeReturnPath);
    }

    [Fact]
    public async Task EvaluateAsync_blocks_unverified_domain_enforcement()
    {
        Guid tenantId = Guid.NewGuid();
        AuthSignInRoutingService sut = CreateSut(out InMemoryTenantSignInEmailDomainRepository domains, out _, out _, out _);

        domains.Seed(
            new TenantSignInEmailDomainRecord
            {
                TenantId = tenantId,
                DisplayDomain = "unverified.example",
                NormalizedDomain = "unverified.example",
                VerificationStatus = AuthDomainVerificationStatus.Unverified,
                EnforcementMode = AuthDomainEnforcementMode.SsoRequiredForVerifiedDomain,
                RequireEnterpriseSso = true,
                CreatedUtc = DateTimeOffset.UtcNow,
                DnsVerificationToken = "token"
            });

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "user@unverified.example" },
            CancellationToken.None);

        Assert.True(result.AllowEmailCode);
    }

    [Fact]
    public async Task EvaluateAsync_requires_sso_for_verified_enforced_domain()
    {
        Guid tenantId = Guid.NewGuid();
        AuthSignInRoutingService sut = CreateSut(
            out InMemoryTenantSignInEmailDomainRepository domains,
            out _,
            out InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
            out _);

        domains.Seed(EnforcedDomain(tenantId, "enterprise.example"));
        idpConfigs.Seed(
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

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "user@enterprise.example" },
            CancellationToken.None);

        Assert.True(result.SsoRequired);
        Assert.False(string.IsNullOrWhiteSpace(result.CustomerMessage));
    }

    [Fact]
    public async Task EvaluateAsync_allows_recovery_admin_bypass()
    {
        Guid tenantId = Guid.NewGuid();
        AuthSignInRoutingService sut = CreateSut(
            out InMemoryTenantSignInEmailDomainRepository domains,
            out InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
            out InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
            out _);

        domains.Seed(
            EnforcedDomain(tenantId, "enterprise.example") with
            {
                EnforcementMode = AuthDomainEnforcementMode.SsoRequiredWithRecoveryException,
                AllowEmailOtpRecovery = true
            });

        idpConfigs.Seed(
            new TenantIdentityProviderConfigurationRecord
            {
                TenantId = tenantId,
                Protocol = TenantIdentityProtocol.Saml,
                IssuerUri = "https://login.enterprise.example",
                ClaimMappingJson = "{}",
                UpdatedUtc = DateTimeOffset.UtcNow,
                UpdatedByActorId = "admin",
                IsActive = true
            });

        recoveryAdmins.Seed(
            new TenantSignInEmailDomainRecoveryAdminRecord
            {
                TenantId = tenantId,
                NormalizedDomain = "enterprise.example",
                NormalizedRecoveryAdminEmail = "breakglass@enterprise.example",
                DisplayRecoveryAdminEmail = "breakglass@enterprise.example",
                CreatedUtc = DateTimeOffset.UtcNow,
                CreatedByActorId = "admin",
                AuthenticationVerifiedUtc = DateTimeOffset.UtcNow
            });

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "breakglass@enterprise.example" },
            CancellationToken.None);

        Assert.True(result.AllowEmailCode);
    }

    [Fact]
    public async Task EvaluateAsync_denies_recovery_admin_bypass_until_authentication_verified()
    {
        Guid tenantId = Guid.NewGuid();
        AuthSignInRoutingService sut = CreateSut(
            out InMemoryTenantSignInEmailDomainRepository domains,
            out InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
            out InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
            out _);

        domains.Seed(
            EnforcedDomain(tenantId, "enterprise.example") with
            {
                EnforcementMode = AuthDomainEnforcementMode.SsoRequiredWithRecoveryException,
                AllowEmailOtpRecovery = true
            });

        idpConfigs.Seed(
            new TenantIdentityProviderConfigurationRecord
            {
                TenantId = tenantId,
                Protocol = TenantIdentityProtocol.Saml,
                IssuerUri = "https://login.enterprise.example",
                ClaimMappingJson = "{}",
                UpdatedUtc = DateTimeOffset.UtcNow,
                UpdatedByActorId = "admin",
                IsActive = true
            });

        recoveryAdmins.Seed(
            new TenantSignInEmailDomainRecoveryAdminRecord
            {
                TenantId = tenantId,
                NormalizedDomain = "enterprise.example",
                NormalizedRecoveryAdminEmail = "breakglass@enterprise.example",
                DisplayRecoveryAdminEmail = "breakglass@enterprise.example",
                CreatedUtc = DateTimeOffset.UtcNow,
                CreatedByActorId = "admin"
            });

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "breakglass@enterprise.example" },
            CancellationToken.None);

        Assert.True(result.SsoRequired);
        Assert.False(result.AllowEmailCode);
    }

    [Fact]
    public async Task EvaluateAsync_rejects_unsafe_return_path()
    {
        AuthSignInRoutingService sut = CreateSut(out _, out _, out _, out _);

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest
            {
                NormalizedEmail = "user@example.com",
                ReturnPath = "https://evil.example/phish"
            },
            CancellationToken.None);

        Assert.Null(result.SafeReturnPath);
    }

    [Fact]
    public async Task EvaluateEnforcementPreviewAsync_predicts_sso_before_enablement()
    {
        Guid tenantId = Guid.NewGuid();
        AuthSignInRoutingService sut = CreateSut(
            out InMemoryTenantSignInEmailDomainRepository domains,
            out _,
            out InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
            out _);

        domains.Seed(
            EnforcedDomain(tenantId, "enterprise.example") with
            {
                EnforcementEnabledUtc = null,
                RoutingTestPassedUtc = null
            });

        idpConfigs.Seed(
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

        AuthSignInRoutingEvaluation live = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "user@enterprise.example" },
            CancellationToken.None);

        AuthSignInRoutingEvaluation preview = await sut.EvaluateEnforcementPreviewAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "user@enterprise.example" },
            tenantId,
            "enterprise.example",
            CancellationToken.None);

        Assert.True(live.AllowEmailCode);
        Assert.True(preview.SsoRequired);
    }

    [Fact]
    public async Task EvaluateAsync_requires_sso_when_invitation_token_email_mismatches()
    {
        Guid tenantId = Guid.NewGuid();
        const string token = "invite-bypass-token";

        AuthSignInRoutingService sut = CreateSut(
            out InMemoryTenantSignInEmailDomainRepository domains,
            out _,
            out InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
            out InMemoryUserInvitationRepository invitations);

        domains.Seed(EnforcedDomain(tenantId, "enterprise.example"));
        idpConfigs.Seed(
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

        await invitations.InsertAsync(
            tenantId,
            Guid.NewGuid(),
            "invitee@enterprise.example",
            "Reader",
            "admin",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest
            {
                NormalizedEmail = "attacker@enterprise.example",
                InvitationToken = token
            },
            CancellationToken.None);

        Assert.False(result.AllowEmailCode);
        Assert.True(result.SsoRequired);
    }

    [Fact]
    public async Task EvaluateAsync_allows_email_code_for_sso_domain_when_invitation_token_matches_email()
    {
        Guid tenantId = Guid.NewGuid();
        const string token = "invite-match-token";

        AuthSignInRoutingService sut = CreateSut(
            out InMemoryTenantSignInEmailDomainRepository domains,
            out _,
            out InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
            out InMemoryUserInvitationRepository invitations);

        domains.Seed(EnforcedDomain(tenantId, "enterprise.example"));
        idpConfigs.Seed(
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

        await invitations.InsertAsync(
            tenantId,
            Guid.NewGuid(),
            "invitee@enterprise.example",
            "Reader",
            "admin",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest
            {
                NormalizedEmail = "invitee@enterprise.example",
                InvitationToken = token
            },
            CancellationToken.None);

        Assert.True(result.AllowEmailCode);
        Assert.False(result.SsoRequired);
    }

    [Fact]
    public async Task EvaluateAsync_requires_sso_when_enforcement_active_but_idp_inactive()
    {
        Guid tenantId = Guid.NewGuid();

        AuthSignInRoutingService sut = CreateSut(
            out InMemoryTenantSignInEmailDomainRepository domains,
            out _,
            out InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
            out _);

        domains.Seed(EnforcedDomain(tenantId, "enterprise.example"));

        AuthSignInRoutingEvaluation result = await sut.EvaluateAsync(
            new AuthSignInRoutingRequest { NormalizedEmail = "user@enterprise.example" },
            CancellationToken.None);

        Assert.True(result.SsoRequired);
        Assert.False(result.AllowEmailCode);
    }
}
