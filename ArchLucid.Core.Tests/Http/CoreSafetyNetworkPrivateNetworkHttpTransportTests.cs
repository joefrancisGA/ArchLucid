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

    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_clamps_minimum_throughput_and_break_duration_lower_bounds_only()
    {
        OutboundExternalHttpResilienceOptions low = new() { MinimumThroughput = 0, BreakDurationSeconds = 1 };
        low.Normalize();

        low.MinimumThroughput.Should().Be(2);
        low.BreakDurationSeconds.Should().Be(5);

        OutboundExternalHttpResilienceOptions high = new() { MinimumThroughput = 10_000, BreakDurationSeconds = 3_600 };
        high.Normalize();

        high.MinimumThroughput.Should().Be(10_000);
        high.BreakDurationSeconds.Should().Be(3_600);
    }

    [Fact]
    public void OutboundSocketsHttpHandlerSettings_cloud_control_plane_allows_higher_pool_than_external_integration()
    {
        using SocketsHttpHandler cloudHandler = new();
        using SocketsHttpHandler integrationHandler = new();

        OutboundSocketsHttpHandlerSettings.Apply(cloudHandler, OutboundHttpSocketsHandlerProfile.CloudControlPlane);
        OutboundSocketsHttpHandlerSettings.Apply(integrationHandler, OutboundHttpSocketsHandlerProfile.ExternalIntegration);

        cloudHandler.MaxConnectionsPerServer.Should().BeGreaterThan(integrationHandler.MaxConnectionsPerServer);
        cloudHandler.MaxConnectionsPerServer.Should().Be(50);
    }

    [Fact]
    public void OutboundHttpClientTimeoutSeconds_devops_integration_uses_longer_budget_than_external_integration()
    {
        OutboundHttpClientTimeoutSeconds.DevOpsIntegration.Should()
            .BeGreaterThan(OutboundHttpClientTimeoutSeconds.ExternalIntegration);
        OutboundHttpClientTimeoutSeconds.DevOpsIntegration.Should().Be(60);
    }

    [Fact]
    public void OutboundSocketsHttpHandlerSettings_internal_loopback_caps_pool_without_connect_callback()
    {
        using SocketsHttpHandler handler = new();

        OutboundSocketsHttpHandlerSettings.Apply(handler, OutboundHttpSocketsHandlerProfile.InternalLoopback);

        handler.MaxConnectionsPerServer.Should().Be(4);
        handler.ConnectCallback.Should().BeNull();
    }

    [Fact]
    public void AzureRmAndRetailPricesHttpRetryPolicy_max_attempts_matches_integration_posture_constant()
    {
        AzureRmAndRetailPricesHttpRetryPolicy.MaxRetryAttempts.Should().Be(3);
        ReferenceEquals(
            typeof(AzureRmAndRetailPricesHttpRetryPolicy).Assembly,
            typeof(ArchLucidAzurePublicHttpClients).Assembly).Should().BeTrue();
    }

    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_clamps_max_retry_attempts_above_ten()
    {
        OutboundExternalHttpResilienceOptions options = new() { MaxRetryAttempts = 25 };
        options.Normalize();

        options.MaxRetryAttempts.Should().Be(10);
    }

    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_clamps_failure_ratio_below_point_one()
    {
        OutboundExternalHttpResilienceOptions options = new() { FailureRatio = 0.01 };
        options.Normalize();

        options.FailureRatio.Should().Be(0.1);
    }

    [Fact]
    public async Task AzureRmAndRetailPricesHttpRetryPolicy_does_not_retry_http_400_bad_request()
    {
        int sendCount = 0;
        IAsyncPolicy<HttpResponseMessage> policy =
            AzureRmAndRetailPricesHttpRetryPolicy.Create(NullLogger.Instance, static _ => TimeSpan.Zero);

        using HttpResponseMessage response = await policy.ExecuteAsync(() =>
        {
            sendCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest));
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        sendCount.Should().Be(1);
    }

    [Fact]
    public void ContentSafetyResult_is_llm_moderation_outcome_not_url_policy()
    {
        ContentSafetyResult blocked = new(false, "blocked", "hate", 0.9);

        blocked.IsAllowed.Should().BeFalse();
        blocked.BlockReason.Should().Be("blocked");
    }

    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_preserves_circuit_breaker_enabled_flag()
    {
        OutboundExternalHttpResilienceOptions disabled = new() { CircuitBreakerEnabled = false, MaxRetryAttempts = 99 };
        disabled.Normalize();

        disabled.CircuitBreakerEnabled.Should().BeFalse();
        disabled.MaxRetryAttempts.Should().Be(10);

        OutboundExternalHttpResilienceOptions enabled = new() { CircuitBreakerEnabled = true };
        enabled.Normalize();

        enabled.CircuitBreakerEnabled.Should().BeTrue();
    }

    [Fact]
    public async Task AzureRmAndRetailPricesHttpRetryPolicy_retries_http_429_too_many_requests()
    {
        int sendCount = 0;
        IAsyncPolicy<HttpResponseMessage> policy =
            AzureRmAndRetailPricesHttpRetryPolicy.Create(NullLogger.Instance, static _ => TimeSpan.Zero);

        using HttpResponseMessage response = await policy.ExecuteAsync(async () =>
        {
            sendCount++;

            if (sendCount < 2)
                return new HttpResponseMessage(HttpStatusCode.TooManyRequests);

            return new HttpResponseMessage(HttpStatusCode.OK);
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        sendCount.Should().Be(2);
    }

    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_clamps_sampling_duration_seconds_lower_bound_to_five()
    {
        OutboundExternalHttpResilienceOptions options = new() { SamplingDurationSeconds = 1 };
        options.Normalize();

        options.SamplingDurationSeconds.Should().Be(5);
    }

    [Fact]
    public void ArchLucidMultiCloudPublicHttpClients_exposes_distinct_factory_client_names()
    {
        ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName.Should().Be("ArchLucid.AwsPublicPricing");
        ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingHttpClientName.Should().Be("ArchLucid.GcpCloudBillingCatalog");
        ArchLucidMultiCloudPublicHttpClients.AwsPricingHttpClientName.Should()
            .NotBe(ArchLucidMultiCloudPublicHttpClients.GcpCloudBillingHttpClientName);
    }

    [Fact]
    public void OutboundSocketsHttpHandlerSettings_llm_completion_uses_longer_pooled_connection_lifetime_than_integration()
    {
        using SocketsHttpHandler llmHandler = new();
        using SocketsHttpHandler integrationHandler = new();

        OutboundSocketsHttpHandlerSettings.Apply(llmHandler, OutboundHttpSocketsHandlerProfile.LlmCompletion);
        OutboundSocketsHttpHandlerSettings.Apply(integrationHandler, OutboundHttpSocketsHandlerProfile.ExternalIntegration);

        llmHandler.PooledConnectionLifetime.Should().BeGreaterThan(integrationHandler.PooledConnectionLifetime);
    }

    [Fact]
    public void OutboundExternalHttpResilienceOptions_uses_stable_configuration_section_name()
    {
        OutboundExternalHttpResilienceOptions.SectionName.Should().Be("ArchLucid:OutboundHttp:Resilience");
    }

    [Fact]
    public async Task AzureRmAndRetailPricesHttpRetryPolicy_retries_after_http_request_exception()
    {
        int sendCount = 0;
        IAsyncPolicy<HttpResponseMessage> policy =
            AzureRmAndRetailPricesHttpRetryPolicy.Create(NullLogger.Instance, static _ => TimeSpan.Zero);

        using HttpResponseMessage response = await policy.ExecuteAsync(() =>
        {
            sendCount++;

            if (sendCount < 2)
                throw new HttpRequestException("transient transport fault");

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        sendCount.Should().Be(2);
    }

    [Fact]
    public void ArchLucidAzurePublicHttpClients_exposes_distinct_arm_and_retail_factory_client_names()
    {
        ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName.Should().Be("ArchLucid.AzureResourceManager");
        ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName.Should().Be("ArchLucid.AzureRetailPrices");
        ArchLucidAzurePublicHttpClients.ResourceManagerHttpClientName.Should()
            .NotBe(ArchLucidAzurePublicHttpClients.RetailPricesHttpClientName);
    }

    [Fact]
    public void OutboundSocketsHttpHandlerSettings_internal_loopback_uses_shorter_pooled_connection_lifetime_than_integration()
    {
        using SocketsHttpHandler loopbackHandler = new();
        using SocketsHttpHandler integrationHandler = new();

        OutboundSocketsHttpHandlerSettings.Apply(loopbackHandler, OutboundHttpSocketsHandlerProfile.InternalLoopback);
        OutboundSocketsHttpHandlerSettings.Apply(integrationHandler, OutboundHttpSocketsHandlerProfile.ExternalIntegration);

        loopbackHandler.PooledConnectionLifetime.Should().BeLessThan(integrationHandler.PooledConnectionLifetime);
    }

    [Fact]
    public void OutboundExternalHttpResilienceOptions_default_max_retry_attempts_is_three_before_normalize()
    {
        OutboundExternalHttpResilienceOptions options = new();

        options.MaxRetryAttempts.Should().Be(3);
    }

    [Fact]
    public async Task AzureRmAndRetailPricesHttpRetryPolicy_retries_http_408_request_timeout()
    {
        int sendCount = 0;
        IAsyncPolicy<HttpResponseMessage> policy =
            AzureRmAndRetailPricesHttpRetryPolicy.Create(NullLogger.Instance, static _ => TimeSpan.Zero);

        using HttpResponseMessage response = await policy.ExecuteAsync(() =>
        {
            sendCount++;

            if (sendCount < 2)
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.RequestTimeout));

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        sendCount.Should().Be(2);
    }
}
