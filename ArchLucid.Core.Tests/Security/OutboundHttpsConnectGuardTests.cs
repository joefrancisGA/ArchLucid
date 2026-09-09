using System.Net;
using System.Net.Sockets;

using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Security;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OutboundHttpsConnectGuardTests
{
    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("10.0.0.5")]
    [InlineData("::1")]
    public void RejectIfForbidden_blocks_private_and_loopback_literals(string host)
    {
        DnsEndPoint endPoint = new(host, 443);

        Action act = () => OutboundHttpsConnectGuard.RejectIfForbidden(endPoint);

        act.Should().Throw<HttpRequestException>()
            .WithMessage("*private network*");
    }

    [Fact]
    public void RejectIfForbidden_allows_public_resolved_literal()
    {
        DnsEndPoint endPoint = new("93.184.216.34", 443);

        Action act = () => OutboundHttpsConnectGuard.RejectIfForbidden(endPoint);

        act.Should().NotThrow();
    }
}
