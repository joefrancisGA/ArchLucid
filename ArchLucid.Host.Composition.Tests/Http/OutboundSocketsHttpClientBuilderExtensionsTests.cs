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
}
