using System.Net.Http;
using System.Reflection;

using ArchLucid.Core.Http;

using ArchLucid.Host.Core.Http;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Tests.Http;

/// <summary>TB-2163 — builder extension wires infinite handler lifetime when pool owns recycling.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OutboundSocketsHttpClientBuilderExtensionsTests
{
    [Fact]
    public void ConfigureArchLucidOutboundSocketsHandler_sets_infinite_handler_lifetime()
    {
        ServiceCollection services = [];
        services.AddHttpClient("tb2163-test")
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);

        IServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();

        using HttpClient client = factory.CreateClient("tb2163-test");

        client.Should().NotBeNull();

        IHttpClientBuilder? builderRegistration = services
            .OfType<ServiceDescriptor>()
            .Select(static d => d.ImplementationInstance)
            .OfType<IHttpClientBuilder>()
            .FirstOrDefault();

        builderRegistration.Should().BeNull("builder metadata is not exposed on ServiceDescriptor");

        IOptionsMonitor<HttpClientFactoryOptions>? optionsMonitor =
            provider.GetService<IOptionsMonitor<HttpClientFactoryOptions>>();

        optionsMonitor.Should().NotBeNull();
        HttpClientFactoryOptions options = optionsMonitor!.Get("tb2163-test");
        options.HandlerLifetime.Should().Be(Timeout.InfiniteTimeSpan);
    }

    [Fact]
    public void ConfigureArchLucidOutboundSocketsHandler_opt_in_wires_private_network_connect_callback()
    {
        ServiceCollection services = [];
        services.AddHttpClient("with-guard")
            .ConfigureArchLucidOutboundSocketsHandler(
                OutboundHttpSocketsHandlerProfile.ExternalIntegration,
                rejectPrivateNetworkConnectEndpoints: true);
        services.AddHttpClient("without-guard")
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration);

        IServiceProvider provider = services.BuildServiceProvider();
        IHttpClientFactory factory = provider.GetRequiredService<IHttpClientFactory>();

        using HttpClient withGuard = factory.CreateClient("with-guard");
        using HttpClient withoutGuard = factory.CreateClient("without-guard");

        GetPrimarySocketsHandler(withGuard).ConnectCallback.Should().NotBeNull();
        GetPrimarySocketsHandler(withoutGuard).ConnectCallback.Should().BeNull();
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
