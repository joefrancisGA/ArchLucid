using ArchiForge.Host.Core.Services.Delivery;

using FluentAssertions;

namespace ArchiForge.Api.Tests;

public sealed class WebhookSignatureTests
{
    [Fact]
    public void ComputeSha256Hex_produces_lowercase_hex_prefixed_by_algorithm()
    {
        byte[] body = "hello"u8.ToArray();

        string hex = WebhookSignature.ComputeSha256Hex("secret", body);

        hex.Should().NotBeNullOrEmpty();
        hex.Should().MatchRegex("^[0-9a-f]+$");
    }

    [Fact]
    public void ComputeSha256Hex_same_inputs_produce_same_output()
    {
        byte[] body = "{\"a\":1}"u8.ToArray();

        string a = WebhookSignature.ComputeSha256Hex("k", body);
        string b = WebhookSignature.ComputeSha256Hex("k", body);

        a.Should().Be(b);
    }

    [Fact]
    public void ComputeSha256Hex_throws_when_secret_empty()
    {
        Action act = () => WebhookSignature.ComputeSha256Hex("", [1]);

        act.Should().Throw<ArgumentException>().WithParameterName("sharedSecret");
    }

    [Fact]
    public void ComputeSha256Hex_throws_when_body_null()
    {
        Action act = () => WebhookSignature.ComputeSha256Hex("s", null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
