using ArchLucid.Core.Pagination;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Pagination;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class Base64UrlCodecTests
{
    [Fact]
    public void TryDecode_returns_false_for_malformed_cursor()
    {
        Base64UrlCodec.TryDecode("%%%not-base64%%%", out byte[] bytes).Should().BeFalse();
        bytes.Should().BeEmpty();
    }

    [Fact]
    public void Encode_and_TryDecode_round_trip()
    {
        byte[] payload = [1, 2, 3, 4];
        string encoded = Base64UrlCodec.Encode(payload);

        Base64UrlCodec.TryDecode(encoded, out byte[] decoded).Should().BeTrue();
        decoded.Should().Equal(payload);
    }
}
