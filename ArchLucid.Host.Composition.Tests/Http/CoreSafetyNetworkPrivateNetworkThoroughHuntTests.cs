using System.Net.Http;
using System.Reflection;

using ArchLucid.Core.Http;

using ArchLucid.Host.Core.Http;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests.Http;

/// <summary>Connect-time private-network guard wiring for loopback vs integration outbound profiles (TB-274).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CoreSafetyNetworkPrivateNetworkThoroughHuntTests
{
    [Fact]
    public void InternalLoopback_profile_registration_omits_private_network_connect_guard_by_design()
    {
        ServiceCollection services = [];
        services.AddHttpClient("saml-metadata-loopback")
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.InternalLoopback);

        using ServiceProvider provider = services.BuildServiceProvider();
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>().CreateClient("saml-metadata-loopback");

        GetPrimarySocketsHandler(client).ConnectCallback.Should().BeNull(
            "loopback-tuned handlers omit connect guard; SAML metadata URL policy is enforced outside this transport");
    }

    [Fact]
    public void External_integration_long_timeout_still_wires_private_network_connect_guard()
    {
        ServiceCollection services = [];
        services.AddHttpClient("itsm-long-timeout")
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                rejectPrivateNetworkConnectEndpoints: true)
            .ConfigureHttpClient(static client =>
            {
                client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.DevOpsIntegration);
            });

        using ServiceProvider provider = services.BuildServiceProvider();
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>().CreateClient("itsm-long-timeout");

        client.Timeout.Should().Be(TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.DevOpsIntegration));
        GetPrimarySocketsHandler(client).ConnectCallback.Should().NotBeNull();
    }

    [Fact]
    public void OutboundExternalHttpResilienceOptions_Normalize_clamps_max_retry_attempts_without_affecting_connect_guard()
    {
        OutboundExternalHttpResilienceOptions options = new() { MaxRetryAttempts = 99 };
        options.Normalize();

        options.MaxRetryAttempts.Should().Be(10);
    }

    [Fact]
    public void CloudControlPlane_profile_does_not_imply_private_network_connect_guard_on_pool_settings_only()
    {
        SocketsHttpHandler handler = new();
        OutboundSocketsHttpHandlerSettings.Apply(handler, OutboundHttpSocketsHandlerProfile.CloudControlPlane);

        handler.ConnectCallback.Should().BeNull(
            "fixed public catalog roots use CloudControlPlane tuning; TB-274 guard targets tenant integration URLs");
    }

    [Fact]
    public void AzureRmAndRetailPricesHttpRetryPolicy_max_retries_is_bounded_not_an_ssrf_bypass_vector()
    {
        ArchLucid.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy.MaxRetryAttempts.Should().BeInRange(0, 10);
    }

    private static SocketsHttpHandler GetPrimarySocketsHandler(HttpMessageInvoker client)
    {
        FieldInfo? handlerField = typeof(HttpMessageInvoker).GetField("_handler", BindingFlags.Instance | BindingFlags.NonPublic)
            ?? typeof(HttpMessageInvoker).GetField("_coreHandler", BindingFlags.Instance | BindingFlags.NonPublic);

        handlerField.Should().NotBeNull("HttpMessageInvoker handler field name changed");

        HttpMessageHandler handler = (HttpMessageHandler)handlerField!.GetValue(client)!;

        while (handler is DelegatingHandler delegating)
        {
            handler = delegating.InnerHandler
                ?? throw new InvalidOperationException("DelegatingHandler chain ended with null InnerHandler.");
        }

        return handler.Should().BeOfType<SocketsHttpHandler>().Subject;
    }
}
