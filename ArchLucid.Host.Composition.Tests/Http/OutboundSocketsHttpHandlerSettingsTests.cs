using System.Net.Http;

using ArchLucid.Core.Http;

using FluentAssertions;

namespace ArchLucid.Host.Composition.Tests.Http;

/// <summary>TB-2163 — tuned <see cref="SocketsHttpHandler" /> pools on outbound clients.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OutboundSocketsHttpHandlerSettingsTests
{
    [Theory]
    [InlineData(OutboundHttpSocketsHandlerProfile.InternalLoopback, 4, false)]
    [InlineData(OutboundHttpSocketsHandlerProfile.ExternalIntegration, 20, true)]
    [InlineData(OutboundHttpSocketsHandlerProfile.CloudControlPlane, 50, true)]
    [InlineData(OutboundHttpSocketsHandlerProfile.LlmCompletion, 20, true)]
    public void Apply_sets_profile_specific_pool_limits(
        OutboundHttpSocketsHandlerProfile profile,
        int expectedMaxConnections,
        bool expectedHttp2Multiplexing)
    {
        SocketsHttpHandler handler = new();
        OutboundSocketsHttpHandlerSettings.Apply(handler, profile);

        handler.MaxConnectionsPerServer.Should().Be(expectedMaxConnections);
        handler.EnableMultipleHttp2Connections.Should().Be(expectedHttp2Multiplexing);
        handler.PooledConnectionLifetime.Should().BeGreaterThan(TimeSpan.Zero);
        handler.PooledConnectionIdleTimeout.Should().BeGreaterThan(TimeSpan.Zero);
    }
}
