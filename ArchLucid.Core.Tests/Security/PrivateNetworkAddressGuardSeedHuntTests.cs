using System.Net;

using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Security;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PrivateNetworkAddressGuardSeedHuntTests
{
    [Theory]
    [InlineData("::ffff:10.0.0.1")]
    [InlineData("::ffff:127.0.0.1")]
    [InlineData("::ffff:192.168.1.1")]
    public void IsForbiddenHostLiteral_blocks_ipv4_mapped_private_addresses(string host)
    {
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host).Should().BeTrue();
    }

    [Theory]
    [InlineData("::ffff:10.0.0.1")]
    [InlineData("::ffff:127.0.0.1")]
    public void IsForbiddenIpAddress_blocks_ipv4_mapped_private_addresses(string address)
    {
        IPAddress ip = IPAddress.Parse(address);

        PrivateNetworkAddressGuard.IsForbiddenIpAddress(ip).Should().BeTrue();
    }
}
