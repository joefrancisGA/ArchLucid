using System.Net.Http;
using System.Reflection;

using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Tests.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationsOutboundHttpClientsTests
{
    [Fact]
    public void External_integration_http_clients_wire_private_network_connect_guard()
    {
        const string clientName = "external-integration-ssrf-guard";

        ServiceCollection services = [];
        services.AddHttpClient(clientName)
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                rejectPrivateNetworkConnectEndpoints: true);

        using ServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();

        using HttpClient client = factory.CreateClient(clientName);

        GetPrimarySocketsHandler(client).ConnectCallback.Should().NotBeNull();

        IOptionsMonitor<HttpClientFactoryOptions>? optionsMonitor =
            provider.GetService<IOptionsMonitor<HttpClientFactoryOptions>>();

        optionsMonitor.Should().NotBeNull();
        optionsMonitor!.Get(clientName).HandlerLifetime.Should().Be(Timeout.InfiniteTimeSpan);
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
