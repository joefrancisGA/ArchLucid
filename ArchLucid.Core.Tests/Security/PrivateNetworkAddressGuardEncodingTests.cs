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
}
