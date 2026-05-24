using ArchLucid.Api.Services;
using ArchLucid.Api.Services.Billing;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Services.Billing;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class MarketplaceWebhookConnectivityServiceTests
{
    [Fact]
    public async Task TestConfiguredWebhookAsync_returns_error_when_webhook_url_missing()
    {
        MarketplaceWebhookConnectivityService sut = CreateSut(new BillingOptions());

        OutboundWebhookDryRunResult result = await sut.TestConfiguredWebhookAsync(CancellationToken.None);

        result.TransportSucceeded.Should().BeFalse();
        result.Error.Should().Contain("WebhookUrl is not configured");
    }

    [Fact]
    public async Task TestConfiguredWebhookAsync_returns_error_when_webhook_url_invalid()
    {
        BillingOptions options = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions
            {
                WebhookUrl = "not-a-uri",
            },
        };

        MarketplaceWebhookConnectivityService sut = CreateSut(options);

        OutboundWebhookDryRunResult result = await sut.TestConfiguredWebhookAsync(CancellationToken.None);

        result.TransportSucceeded.Should().BeFalse();
        result.Error.Should().Contain("not a valid absolute URI");
    }

    [Fact]
    public async Task TestConfiguredWebhookAsync_delegates_probe_when_webhook_url_valid()
    {
        Uri destination = new("https://api.example/v1/billing/webhooks/marketplace");
        Mock<IOutboundWebhookDryRunService> probe = new();
        probe
            .Setup(service => service.ProbeAsync(destination, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OutboundWebhookDryRunResult { TransportSucceeded = true, StatusCode = 200 });

        BillingOptions options = new()
        {
            AzureMarketplace = new AzureMarketplaceBillingOptions
            {
                WebhookUrl = destination.ToString(),
            },
        };

        MarketplaceWebhookConnectivityService sut = new(Options.Create(options), probe.Object);

        OutboundWebhookDryRunResult result = await sut.TestConfiguredWebhookAsync(CancellationToken.None);

        result.TransportSucceeded.Should().BeTrue();
        probe.Verify(
            service => service.ProbeAsync(destination, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static MarketplaceWebhookConnectivityService CreateSut(BillingOptions options)
    {
        return new MarketplaceWebhookConnectivityService(
            Options.Create(options),
            Mock.Of<IOutboundWebhookDryRunService>());
    }
}
