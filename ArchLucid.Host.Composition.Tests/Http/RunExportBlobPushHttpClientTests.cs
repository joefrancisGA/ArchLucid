using System.Net.Http;
using System.Reflection;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Tests.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunExportBlobPushHttpClientTests
{
    [Fact]
    public void RunExportBlobPush_http_client_wires_private_network_connect_guard()
    {
        ServiceCollection services = [];
        services.AddHttpClient(RunExportBlobPushService.HttpClientName, static client =>
            {
                client.Timeout = TimeSpan.FromMinutes(5);
            })
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                rejectPrivateNetworkConnectEndpoints: true);

        using ServiceProvider provider = services.BuildServiceProvider();
        using HttpClient client = provider.GetRequiredService<IHttpClientFactory>().CreateClient(RunExportBlobPushService.HttpClientName);

        GetPrimarySocketsHandler(client).ConnectCallback.Should().NotBeNull(
            "blob push validates DNS then PUTs; connect-time guard closes rebinding to private addresses");

        IOptionsMonitor<HttpClientFactoryOptions>? optionsMonitor =
            provider.GetService<IOptionsMonitor<HttpClientFactoryOptions>>();

        optionsMonitor.Should().NotBeNull();
        optionsMonitor!.Get(RunExportBlobPushService.HttpClientName).HandlerLifetime.Should().Be(Timeout.InfiniteTimeSpan);
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
