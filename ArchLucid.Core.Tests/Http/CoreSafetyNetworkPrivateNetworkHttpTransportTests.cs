using System.Net;
using System.Net.Http;

using ArchLucid.Core.Http;
using ArchLucid.Core.Safety;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Polly;

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

    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_does_not_apply_an_upper_bound_to_sampling_duration_seconds()
    {
        OutboundExternalHttpResilienceOptions options = new() { SamplingDurationSeconds = 86_400 };
        options.Normalize();

        options.SamplingDurationSeconds.Should().Be(86_400);
    }

    [Fact]
    public void OutboundHttpClientTimeoutSeconds_internal_loopback_probe_uses_longer_budget_than_diagnostics()
    {
        OutboundHttpClientTimeoutSeconds.InternalLoopbackProbe.Should()
            .BeGreaterThan(OutboundHttpClientTimeoutSeconds.InternalDiagnostics);
    }

    [Fact]
    public void OutboundSocketsHttpHandlerSettings_llm_completion_shares_max_connections_per_server_with_external_integration()
    {
        using SocketsHttpHandler llmHandler = new();
        using SocketsHttpHandler integrationHandler = new();

        OutboundSocketsHttpHandlerSettings.Apply(llmHandler, OutboundHttpSocketsHandlerProfile.LlmCompletion);
        OutboundSocketsHttpHandlerSettings.Apply(integrationHandler, OutboundHttpSocketsHandlerProfile.ExternalIntegration);

        llmHandler.MaxConnectionsPerServer.Should().Be(integrationHandler.MaxConnectionsPerServer);
    }

    [Fact]
    public async Task AzureRmAndRetailPricesHttpRetryPolicy_retries_http_502_on_fixed_public_authorities()
    {
        int sendCount = 0;
        IAsyncPolicy<HttpResponseMessage> policy =
            AzureRmAndRetailPricesHttpRetryPolicy.Create(NullLogger.Instance, static _ => TimeSpan.Zero);

        using HttpResponseMessage response = await policy.ExecuteAsync(async () =>
        {
            sendCount++;

            if (sendCount < 2)
                return new HttpResponseMessage(HttpStatusCode.BadGateway);

            return new HttpResponseMessage(HttpStatusCode.OK);
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        sendCount.Should().Be(2);
    }

    [Fact]
    public void IContentSafetyGuard_is_prompt_moderation_contract_not_outbound_url_ssrf_policy()
    {
        typeof(IContentSafetyGuard).IsInterface.Should().BeTrue();
        typeof(IContentSafetyGuard).GetMethods().Should().HaveCount(2);
    }
}
