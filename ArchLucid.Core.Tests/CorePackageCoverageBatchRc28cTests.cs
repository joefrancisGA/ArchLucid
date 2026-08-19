using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests;

/// <summary>
///     RC28c package-coverage batch: commercial/erasure eligibility edges, data-region normalize, scope defaults,
///     trusted API link fallbacks, and ITSM provider/auth label helpers.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc28cTests
{
    [Fact]
    public void CommercialTenantEligibility_blocks_active_trial_from_standard_gates()
    {
        TenantRecord trial = new()
        {
            Tier = TenantTier.Free,
            TrialStatus = TrialLifecycleStatus.Active,
        };
        TenantRecord paid = new()
        {
            Tier = TenantTier.Standard,
            TrialStatus = TrialLifecycleStatus.Converted,
        };

        CommercialTenantEligibility.MeetsCommercialTenantTierGate(trial, TenantTier.Standard).Should().BeFalse();
        CommercialTenantEligibility.MeetsCommercialTenantTierGate(paid, TenantTier.Standard).Should().BeTrue();
        CommercialTenantEligibility.IsEligibleForWeeklySponsorReport(trial).Should().BeFalse();
        CommercialTenantEligibility.IsEligibleForWeeklySponsorReport(paid).Should().BeTrue();

        TenantRecord suspended = new()
        {
            Tier = TenantTier.Standard,
            TrialStatus = TrialLifecycleStatus.Converted,
            SuspendedUtc = DateTimeOffset.UtcNow,
        };
        CommercialTenantEligibility.IsEligibleForWeeklySponsorReport(suspended).Should().BeFalse();
    }

    [Fact]
    public void TenantErasureEligibility_quarantine_and_hard_purge_predicates()
    {
        DateTimeOffset now = DateTimeOffset.Parse("2026-08-10T12:00:00Z");
        TenantRecord quarantine = new() { OffboardedUtc = now.AddDays(-1) };
        TenantErasureEligibility.IsInErasureQuarantine(quarantine).Should().BeTrue();
        TenantErasureEligibility.IsTenantLoginBlocked(quarantine, now).Should().BeTrue();

        TenantRecord scheduled = new()
        {
            TenantErasureRequestedUtc = now.AddMinutes(-1),
        };
        TenantErasureEligibility.IsTenantLoginBlocked(scheduled, now).Should().BeTrue();
        TenantErasureEligibility.IsTenantLoginBlocked(scheduled, now.AddHours(-1)).Should().BeFalse();

        TenantRecord purgeReady = new()
        {
            OffboardedUtc = now.AddDays(-10),
            ErasureEligibleUtc = now.AddDays(-1),
        };
        TenantErasureEligibility.IsEligibleForScheduledHardPurge(purgeReady, now).Should().BeTrue();

        TenantRecord legalHold = new()
        {
            OffboardedUtc = now.AddDays(-10),
            ErasureEligibleUtc = now.AddDays(-1),
            LegalHoldUntilUtc = now.AddDays(30),
        };
        TenantErasureEligibility.IsEligibleForScheduledHardPurge(legalHold, now).Should().BeFalse();
    }

    [Fact]
    public void TenantDataRegions_Normalize_and_NormalizeOptional()
    {
        TenantDataRegions.Normalize(" EastUS ").Should().Be("eastus");
        TenantDataRegions.NormalizeOptional(null).Should().Be(TenantDataRegions.Default);
        TenantDataRegions.NormalizeOptional("  ").Should().Be(TenantDataRegions.Default);
        TenantDataRegions.PlatformDefaultSupportedRegions.Should().Contain(TenantDataRegions.Default);
        FluentActions.Invoking(() => TenantDataRegions.Normalize("  ")).Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ScopeIds_IsDevelopmentDefault_detects_well_known_guids()
    {
        ScopeIds.IsDevelopmentDefault(ScopeIds.DefaultTenant).Should().BeTrue();
        ScopeIds.IsDevelopmentDefault(ScopeIds.DefaultWorkspace).Should().BeTrue();
        ScopeIds.IsDevelopmentDefault(ScopeIds.DefaultProject).Should().BeTrue();
        ScopeIds.IsDevelopmentDefault(Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).Should().BeFalse();
    }

    [Fact]
    public void TrustedApiLinkBaseResolver_uses_request_host_when_public_and_configured_override()
    {
        IConfiguration empty = new ConfigurationBuilder().AddInMemoryCollection().Build();
        TrustedApiLinkBaseResolver.Resolve(empty, "https", "app.example.com").Should().Be("https://app.example.com");
        TrustedApiLinkBaseResolver.Resolve(empty, null, "localhost").Should().Be("http://localhost:5000");

        IConfiguration configured = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [TrustedApiLinkBaseResolver.PublicApiBaseUrlConfigurationKey] = "https://api.example.com/",
            })
            .Build();
        TrustedApiLinkBaseResolver.Resolve(configured, "http", "ignored").Should().Be("https://api.example.com");
    }

    [Theory]
    [InlineData("Jira", "Jira", "Jira")]
    [InlineData("ServiceNow", "ServiceNow", "ServiceNow")]
    [InlineData("AzureBoards", "Azure Boards", "AzureBoards")]
    public void TenantItsmConnectorConnectionUpsertValidation_provider_labels(
        string raw,
        string display,
        string persistence)
    {
        TenantItsmConnectorConnectionUpsertValidation.TryParseProvider(raw, out TenantItsmConnectorProvider provider, out _)
            .Should().BeTrue();
        TenantItsmConnectorConnectionUpsertValidation.ToProviderLabel(provider).Should().Be(display);
        TenantItsmConnectorConnectionUpsertValidation.ToProviderPersistenceLabel(provider).Should().Be(persistence);
    }

    [Theory]
    [InlineData("BasicApiToken", ItsmConnectorAuthMode.BasicApiToken)]
    [InlineData("OAuth2ClientCredentials", ItsmConnectorAuthMode.OAuth2ClientCredentials)]
    [InlineData("OAuth2RefreshToken", ItsmConnectorAuthMode.OAuth2RefreshToken)]
    public void TenantItsmConnectorConnectionUpsertValidation_auth_mode_round_trip(string label, ItsmConnectorAuthMode mode)
    {
        TenantItsmConnectorConnectionUpsertValidation.TryParseAuthMode(label, out ItsmConnectorAuthMode parsed, out _)
            .Should().BeTrue();
        parsed.Should().Be(mode);
        TenantItsmConnectorConnectionUpsertValidation.ToAuthModeLabel(mode).Should().Be(label);
        TenantItsmConnectorConnectionUpsertValidation.TryParseAuthModeLabel(label, out ItsmConnectorAuthMode again)
            .Should().BeTrue();
        again.Should().Be(mode);
    }

    [Fact]
    public void TenantItsmConnectorConnectionUpsertValidation_rejects_invalid_instance_url_and_raw_secret()
    {
        TenantItsmConnectorConnectionUpsertValidation
            .TryValidateInstanceBaseUrl(null, out _, out string? missing)
            .Should().BeFalse();
        missing.Should().Be(TenantItsmConnectorConnectionUpsertValidation.InstanceBaseUrlRequiredMessage);

        TenantItsmConnectorConnectionUpsertValidation
            .TryValidateInstanceBaseUrl("ftp://vendor.example", out _, out string? invalid)
            .Should().BeFalse();
        invalid.Should().Be(TenantItsmConnectorConnectionUpsertValidation.InstanceBaseUrlInvalidMessage);

        TenantItsmConnectorConnectionUpsertValidation
            .TryValidateCredentialKeyVaultSecretName("https://kv.example/secrets/pat", out _, out string? raw)
            .Should().BeFalse();
        raw.Should().Be(TenantItsmConnectorConnectionUpsertValidation.RawCredentialRejectedMessage);
    }
}
