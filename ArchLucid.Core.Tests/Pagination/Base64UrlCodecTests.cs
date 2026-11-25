using ArchLucid.Core.Codecs;

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

    [Theory]
    [InlineData("FF", "_w")]
    [InlineData("FBFF", "-_8")]
    [InlineData("FBFFFF", "-___")]
    public void Encode_UsesTheUnpaddedUrlSafeAlphabet(string payloadHex, string expected)
    {
        Base64UrlCodec.Encode(Convert.FromHexString(payloadHex)).Should().Be(expected);
    }

    [Theory]
    [InlineData("_w", "FF")]
    [InlineData("-_8", "FBFF")]
    [InlineData("-___", "FBFFFF")]
    public void TryDecode_AcceptsKnownUnpaddedUrlSafeVectors(string encoded, string expectedHex)
    {
        Base64UrlCodec.TryDecode(encoded, out byte[] bytes).Should().BeTrue();
        bytes.Should().Equal(Convert.FromHexString(expectedHex));
    }
}
