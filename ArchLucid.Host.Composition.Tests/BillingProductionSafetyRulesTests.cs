using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BillingProductionSafetyRulesTests
{
    [Fact]
    public void CollectStripeTestKeyDisallowedInProduction_when_sk_test_adds_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Stripe:SecretKey"] = "sk_test_unit_test_placeholder_not_a_real_key",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectStripeTestKeyDisallowedInProduction(configuration, errors);

        errors.Should()
            .ContainSingle(static e => e.Contains("sk_test_", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectStripeTestKeyDisallowedInProduction_when_sk_live_is_clean()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Stripe:SecretKey"] = "sk_live_unit_test_placeholder_not_a_real_key",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectStripeTestKeyDisallowedInProduction(configuration, errors);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectStripeLiveKeyRequiresWebhookSigningSecret_when_sk_live_without_whsec_adds_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Stripe:SecretKey"] = "sk_live_unit_test_placeholder_not_a_real_key",
            ["Billing:Stripe:WebhookSigningSecret"] = ""
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectStripeLiveKeyRequiresWebhookSigningSecret(configuration, errors);

        errors.Should()
            .ContainSingle(static e => e.Contains("sk_live_", StringComparison.Ordinal)
                                       && e.Contains("WebhookSigningSecret", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectStripeLiveKeyRequiresWebhookSigningSecret_when_sk_live_with_whsec_is_clean()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Stripe:SecretKey"] = "sk_live_unit_test_placeholder_not_a_real_key",
            ["Billing:Stripe:WebhookSigningSecret"] = "whsec_unit_test_placeholder_not_a_real_secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectStripeLiveKeyRequiresWebhookSigningSecret(configuration, errors);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectAzureMarketplaceLandingPageUrl_when_localhost_adds_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:LandingPageUrl"] = "https://localhost:3000/marketplace/landing"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectAzureMarketplaceLandingPageUrl(configuration, errors);

        errors.Should().ContainSingle(static e => e.Contains("localhost", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CollectAzureMarketplaceLandingPageUrl_when_https_public_host_is_clean()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:LandingPageUrl"] = "https://app.archlucid.net/marketplace/landing"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectAzureMarketplaceLandingPageUrl(configuration, errors);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectAzureMarketplaceWebhookUrl_when_ngrok_host_adds_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:WebhookUrl"] = "https://contoso.ngrok.io/v1/billing/webhooks/marketplace"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectAzureMarketplaceWebhookUrl(configuration, errors);

        errors.Should().ContainSingle(static e => e.Contains("ngrok", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CollectAzureMarketplaceWebhookUrl_when_https_public_host_is_clean()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:WebhookUrl"] = "https://app.archlucid.net/v1/billing/webhooks/marketplace"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectAzureMarketplaceWebhookUrl(configuration, errors);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void CollectAzureMarketplaceGaRequiresOfferId_when_ga_true_and_empty_offer_adds_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:GaEnabled"] = "true",
            ["Billing:AzureMarketplace:MarketplaceOfferId"] = ""
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectAzureMarketplaceGaRequiresOfferId(configuration, errors);

        errors.Should()
            .ContainSingle(static e => e.Contains("MarketplaceOfferId", StringComparison.Ordinal));
    }

    [Fact]
    public void CollectAzureMarketplaceGaRequiresOfferId_when_ga_true_and_offer_set_is_clean()
    {
        Dictionary<string, string?> data = new()
        {
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:GaEnabled"] = "true",
            ["Billing:AzureMarketplace:MarketplaceOfferId"] = "contoso-archlucid-saas-offer"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        List<string> errors = [];

        BillingProductionSafetyRules.CollectAzureMarketplaceGaRequiresOfferId(configuration, errors);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void IsBillingSafetyError_when_prefixed_returns_true()
    {
        const string error = BillingProductionSafetyRules.ErrorPrefix + "Billing:Stripe:SecretKey uses Stripe test prefix sk_test_.";

        BillingProductionSafetyRules.IsBillingSafetyError(error).Should().BeTrue();
    }

    [Fact]
    public void IsBillingSafetyError_when_not_prefixed_returns_false()
    {
        BillingProductionSafetyRules.IsBillingSafetyError("ConnectionStrings:ArchLucid is missing.").Should().BeFalse();
    }

    [Fact]
    public void LogCriticalForMatchingErrors_logs_only_billing_prefixed_messages()
    {
        List<string> errors =
        [
            BillingProductionSafetyRules.ErrorPrefix + "Billing:AzureMarketplace:LandingPageUrl must not use localhost.",
            "AgentExecution:Mode is invalid.",
        ];

        TestLogger logger = new();

        BillingProductionSafetyRules.LogCriticalForMatchingErrors(errors, logger);

        logger.CriticalMessages.Should().ContainSingle(message =>
            message.Contains("Billing production safety validation failed", StringComparison.Ordinal)
            && message.Contains("localhost", StringComparison.OrdinalIgnoreCase));
    }

    private sealed class TestLogger : ILogger
    {
        public List<string> CriticalMessages { get; } = [];
        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;
                public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (logLevel != LogLevel.Critical)
                return;

            CriticalMessages.Add(formatter(state, exception));
        }

        private sealed class NullScope : IDisposable
        {
            public static readonly NullScope Instance = new();

            public void Dispose()
            {
                // No resources to release, method intentionally left empty.
            }
        }
    }
}
