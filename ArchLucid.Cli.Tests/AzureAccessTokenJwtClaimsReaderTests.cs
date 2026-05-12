using System.Text;
using System.Text.Json.Nodes;

using ArchLucid.Cli;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureAccessTokenJwtClaimsReaderTests
{
    [Fact]
    public void TryReadPayloadAsJsonObject_parses_valid_jwt_middle_segment()
    {
        string jwt = BuildJwt("""{"aud":"management","oid":"11111111-1111-1111-1111-111111111111"}""");

        AzureAccessTokenJwtClaimsReader.TryReadPayloadAsJsonObject(jwt, out JsonObject? claims).Should().BeTrue();

        claims.Should().NotBeNull();

        claims!["aud"]!.GetValue<string>().Should().Be("management");

        claims["oid"]!.GetValue<string>().Should().Be("11111111-1111-1111-1111-111111111111");
    }

    [Fact]
    public void TryReadPayloadAsJsonObject_rejects_when_not_three_segments()
    {
        AzureAccessTokenJwtClaimsReader.TryReadPayloadAsJsonObject("a.b", out JsonObject? claims).Should().BeFalse();

        claims.Should().BeNull();
    }

    private static string BuildJwt(string payloadJson)
    {
        static string B64Url(string utf8Text) =>
            Convert.ToBase64String(Encoding.UTF8.GetBytes(utf8Text)).TrimEnd('=')
                .Replace('+', '-', StringComparison.Ordinal)
                .Replace('/', '_', StringComparison.Ordinal);

        return $"{B64Url(@"{""alg"":""none"",""typ"":""JWT""}")}.{B64Url(payloadJson)}.sig";
    }
}
