using System.Net.Http;

using ArchLucid.Core.Http;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Http;

/// <summary>Transport tuning in <c>ArchLucid.Core/Http</c> for core-safety-network seed hunts (TB-274 scope boundary).</summary>
[Trait("Category", "Unit")]
public sealed class CoreSafetyNetworkPrivateNetworkHttpTransportTests
{
    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_clamps_failure_ratio_above_one()
    {
        OutboundExternalHttpResilienceOptions options = new() { FailureRatio = 2.5 };
        options.Normalize();

        options.FailureRatio.Should().Be(1.0);
    }

    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_clamps_negative_max_retry_attempts_to_zero()
    {
        OutboundExternalHttpResilienceOptions options = new() { MaxRetryAttempts = -3 };
        options.Normalize();

        options.MaxRetryAttempts.Should().Be(0);
    }

    [Fact]
    public void ArchLucidAzurePublicHttpClients_authorities_use_https_public_hosts()
    {
        ArchLucidAzurePublicHttpClients.ResourceManagerAuthority.Scheme.Should().Be("https");
        ArchLucidAzurePublicHttpClients.RetailPricesAuthority.Scheme.Should().Be("https");
        ArchLucidAzurePublicHttpClients.ResourceManagerAuthority.Host.Should().Be("management.azure.com");
        ArchLucidAzurePublicHttpClients.RetailPricesAuthority.Host.Should().Be("prices.azure.com");
    }

    [Fact]
    public void ArchLucidMultiCloudPublicHttpClients_authorities_use_https_public_hosts()
    {
        ArchLucidMultiCloudPublicHttpClients.AwsPricingAuthority.Scheme.Should().Be("https");
        ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingAuthority.Scheme.Should().Be("https");
        ArchLucidMultiCloudPublicHttpClients.AwsPricingAuthority.Host.Should().Be("pricing.us-east-1.amazonaws.com");
        ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingAuthority.Host.Should().Be("cloudbilling.googleapis.com");
    }

    [Fact]
    public void OutboundSocketsHttpHandlerSettings_Apply_throws_for_unknown_profile_value()
    {
        SocketsHttpHandler handler = new();
        OutboundHttpSocketsHandlerProfile invalid = (OutboundHttpSocketsHandlerProfile)99;

        Action act = () => OutboundSocketsHttpHandlerSettings.Apply(handler, invalid);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
