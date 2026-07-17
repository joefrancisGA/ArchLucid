using ArchLucid.Application.Identity;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class TenantAuthDomainAdminServiceTests
{
    [Fact]
    public async Task GetEnforcementReadinessAsync_blocks_recovery_mode_without_verified_recovery_admin()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSignInEmailDomainRepository domains = new();
        InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins = new();
        InMemoryTenantIdentityProviderConfigurationRepository idpConfigs = new();
        InMemoryPlatformTenantAuthRecoveryGrantRepository grants = new();
        InMemoryWorkspaceMembershipRepository memberships = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        domains.Seed(CreateVerifiedDomain(tenantId, "enterprise.example") with
        {
            EnforcementMode = AuthDomainEnforcementMode.SsoRequiredWithRecoveryException,
            AllowEmailOtpRecovery = true
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

        recoveryAdmins.Seed(new TenantSignInEmailDomainRecoveryAdminRecord
        {
            TenantId = tenantId,
            NormalizedDomain = "enterprise.example",
            NormalizedRecoveryAdminEmail = "breakglass@enterprise.example",
            DisplayRecoveryAdminEmail = "breakglass@enterprise.example",
            CreatedUtc = clock.GetUtcNow(),
            CreatedByActorId = "admin"
        });

        TenantAuthDomainAdminService sut = CreateSut(domains, recoveryAdmins, idpConfigs, grants, memberships, clock);

        TenantAuthDomainEnforcementReadiness readiness =
            await sut.GetEnforcementReadinessAsync(tenantId, "enterprise.example", CancellationToken.None);

        Assert.True(readiness.BlockEnforcement);
        Assert.False(readiness.CanEnableEnforcement);
        Assert.False(readiness.HasRecoveryRoute);
    }

    [Fact]
    public async Task TryRemoveRecoveryAdminAsync_warns_when_last_recovery_admin_without_confirmation()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSignInEmailDomainRepository domains = new();
        InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        domains.Seed(CreateVerifiedDomain(tenantId, "enterprise.example") with
        {
            EnforcementMode = AuthDomainEnforcementMode.SsoRequiredWithRecoveryException,
            AllowEmailOtpRecovery = true,
            EnforcementEnabledUtc = clock.GetUtcNow(),
            RoutingTestPassedUtc = clock.GetUtcNow()
        });

        recoveryAdmins.Seed(new TenantSignInEmailDomainRecoveryAdminRecord
        {
            TenantId = tenantId,
            NormalizedDomain = "enterprise.example",
            NormalizedRecoveryAdminEmail = "breakglass@enterprise.example",
            DisplayRecoveryAdminEmail = "breakglass@enterprise.example",
            CreatedUtc = clock.GetUtcNow(),
            CreatedByActorId = "admin",
            AuthenticationVerifiedUtc = clock.GetUtcNow()
        });

        TenantAuthDomainAdminService sut = CreateSut(
            domains,
            recoveryAdmins,
            new InMemoryTenantIdentityProviderConfigurationRepository(),
            new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
            new InMemoryWorkspaceMembershipRepository(),
            clock);

        TenantAuthDomainRecoveryAdminRemovalResult result = await sut.TryRemoveRecoveryAdminAsync(
            tenantId,
            "enterprise.example",
            "breakglass@enterprise.example",
            confirmRemoveLast: false,
            CancellationToken.None);

        Assert.False(result.Removed);
        Assert.True(result.WasLastRecoveryAdmin);
        Assert.Contains("last recovery administrator", result.WarningMessage!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task TryRemoveRecoveryAdminAsync_blocks_last_recovery_admin_when_enforcement_active_even_with_confirmation()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSignInEmailDomainRepository domains = new();
        InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        domains.Seed(CreateVerifiedDomain(tenantId, "enterprise.example") with
        {
            EnforcementMode = AuthDomainEnforcementMode.SsoRequiredWithRecoveryException,
            AllowEmailOtpRecovery = true,
            EnforcementEnabledUtc = clock.GetUtcNow(),
            RoutingTestPassedUtc = clock.GetUtcNow()
        });

        recoveryAdmins.Seed(new TenantSignInEmailDomainRecoveryAdminRecord
        {
            TenantId = tenantId,
            NormalizedDomain = "enterprise.example",
            NormalizedRecoveryAdminEmail = "breakglass@enterprise.example",
            DisplayRecoveryAdminEmail = "breakglass@enterprise.example",
            CreatedUtc = clock.GetUtcNow(),
            CreatedByActorId = "admin",
            AuthenticationVerifiedUtc = clock.GetUtcNow()
        });

        TenantAuthDomainAdminService sut = CreateSut(
            domains,
            recoveryAdmins,
            new InMemoryTenantIdentityProviderConfigurationRepository(),
            new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
            new InMemoryWorkspaceMembershipRepository(),
            clock);

        TenantAuthDomainRecoveryAdminRemovalResult result = await sut.TryRemoveRecoveryAdminAsync(
            tenantId,
            "enterprise.example",
            "breakglass@enterprise.example",
            confirmRemoveLast: true,
            CancellationToken.None);

        Assert.False(result.Removed);
        Assert.True(result.WasLastRecoveryAdmin);
        Assert.Contains("Cannot remove the last recovery administrator", result.WarningMessage!, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task EnableEnforcementAsync_rejects_sso_only_without_recovery_path()
    {
        Guid tenantId = Guid.NewGuid();
        InMemoryTenantSignInEmailDomainRepository domains = new();
        FakeTimeProvider clock = new(DateTimeOffset.UtcNow);

        domains.Seed(CreateVerifiedDomain(tenantId, "enterprise.example") with
        {
            EnforcementMode = AuthDomainEnforcementMode.SsoRequiredForVerifiedDomain,
            RequireEnterpriseSso = true,
            RoutingTestPassedUtc = clock.GetUtcNow()
        });

        InMemoryTenantIdentityProviderConfigurationRepository idpConfigs = new();
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

        TenantAuthDomainAdminService sut = CreateSut(
            domains,
            new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
            idpConfigs,
            new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
            new InMemoryWorkspaceMembershipRepository(),
            clock);

        InvalidOperationException ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.EnableEnforcementAsync(tenantId, "enterprise.example", true, CancellationToken.None));

        Assert.Contains("no tenant recovery path", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static TenantAuthDomainAdminService CreateSut(
        InMemoryTenantSignInEmailDomainRepository domains,
        InMemoryTenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
        InMemoryTenantIdentityProviderConfigurationRepository idpConfigs,
        InMemoryPlatformTenantAuthRecoveryGrantRepository grants,
        InMemoryWorkspaceMembershipRepository memberships,
        FakeTimeProvider clock) =>
        new(
            domains,
            recoveryAdmins,
            idpConfigs,
            grants,
            memberships,
            new AuthDomainDnsVerificationService(new NoOpDnsTxtRecordLookup(), clock),
            new AuthSignInRoutingService(
                domains,
                recoveryAdmins,
                idpConfigs,
                new InMemoryUserInvitationRepository(),
                grants,
                clock),
            clock);

    private static TenantSignInEmailDomainRecord CreateVerifiedDomain(Guid tenantId, string domain) =>
        new()
        {
            TenantId = tenantId,
            DisplayDomain = domain,
            NormalizedDomain = domain,
            VerificationStatus = AuthDomainVerificationStatus.Verified,
            EnforcementMode = AuthDomainEnforcementMode.SsoOptional,
            DnsVerificationToken = "token",
            RequireEnterpriseSso = false,
            AllowEmailOtpRecovery = false,
            CreatedUtc = DateTimeOffset.UtcNow,
            VerifiedUtc = DateTimeOffset.UtcNow,
            UpdatedUtc = DateTimeOffset.UtcNow
        };

    private sealed class NoOpDnsTxtRecordLookup : IDnsTxtRecordLookup
    {
        public Task<IReadOnlyList<string>> GetTxtRecordsAsync(string domain, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<string>>([]);
    }
}
