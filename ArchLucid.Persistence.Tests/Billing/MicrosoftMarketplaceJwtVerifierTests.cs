using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Billing.AzureMarketplace;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class MicrosoftMarketplaceJwtVerifierTests
{
    [SkippableFact]
    public async Task ValidateAsync_without_metadata_returns_null()
    {
        BillingOptions billing = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions
            {
                OpenIdMetadataAddress = null, ValidAudiences = ["https://marketplaceapi.microsoft.com"]
            }
        };

        TestMonitor<BillingOptions> monitor = new(billing);
        MicrosoftMarketplaceJwtVerifier sut = new(monitor);

        MarketplaceWebhookValidatedToken? validated =
            await sut.ValidateAsync("any.jwt.here", CancellationToken.None);

        validated.Should().BeNull();
    }

    [SkippableFact]
    public async Task ValidateAsync_blank_token_returns_null()
    {
        BillingOptions billing = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions
            {
                OpenIdMetadataAddress = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
                ValidAudiences = ["https://marketplaceapi.microsoft.com"]
            }
        };

        MicrosoftMarketplaceJwtVerifier sut = new(new TestMonitor<BillingOptions>(billing));

        MarketplaceWebhookValidatedToken? validated =
            await sut.ValidateAsync("   ", CancellationToken.None);

        validated.Should().BeNull();
    }

    [SkippableFact]
    public async Task ValidateAsync_empty_audiences_returns_null()
    {
        BillingOptions billing = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions
            {
                OpenIdMetadataAddress = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
                ValidAudiences = []
            }
        };

        MicrosoftMarketplaceJwtVerifier sut = new(new TestMonitor<BillingOptions>(billing));

        MarketplaceWebhookValidatedToken? validated =
            await sut.ValidateAsync("any.jwt.here", CancellationToken.None);

        validated.Should().BeNull();
    }

    private sealed class TestMonitor<T>(T value) : IOptionsMonitor<T>
        where T : class
    {
        public T CurrentValue
        {
            get;
        } = value;

        public T Get(string? name)
        {
            return CurrentValue;
        }

        public IDisposable? OnChange(Action<T, string?> listener)
        {
            return null;
        }
    }
}
