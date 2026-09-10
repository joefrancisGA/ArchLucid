using System.Net;

using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Security;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PrivateNetworkAddressGuardEncodingTests
{
    [Theory]
    [InlineData("0177.0.0.1")]
    [InlineData("0x7f000001")]
    [InlineData("127.1")]
    [InlineData("192.168.001.001")]
    public void IsForbiddenHostLiteral_blocks_private_loopback_encodings(string host)
    {
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host).Should().BeTrue();
    }

    [Fact]
    public void IsForbiddenHostLiteral_allows_octal_public_first_octet()
    {
        // 010.000.000.001 == 8.0.0.1 (public); must not be treated as private 10.0.0.1.
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral("010.000.000.001").Should().BeFalse();
    }

    [Theory]
    [InlineData("100.64.0.1")]
    [InlineData("198.18.0.1")]
    public void IsForbiddenHostLiteral_allows_out_of_scope_shared_and_benchmark_ipv4(string host)
    {
        // TB-274 scope is RFC1918 / link-local / loopback / IPv6 ULA — not RFC6598 CGNAT or RFC2544 benchmark space.
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral(host).Should().BeFalse();
        PrivateNetworkAddressGuard.IsForbiddenIpAddress(IPAddress.Parse(host)).Should().BeFalse();
    }

    [Fact]
    public void IsForbiddenHostLiteral_blocks_unspecified_ipv4_zero_address()
    {
        PrivateNetworkAddressGuard.IsForbiddenHostLiteral("0.0.0.0").Should().BeTrue();
    }
}
