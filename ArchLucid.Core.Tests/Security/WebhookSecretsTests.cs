using ArchLucid.Core.Security;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Security;

[Trait("Category", "Unit")]
public sealed class WebhookSecretsTests
{
    [Fact]
    public void SecureEquals_matches_equal_secrets()
    {
        WebhookSecrets.SecureEquals("same", "same").Should().BeTrue();
    }

    [Fact]
    public void SecureEquals_rejects_mismatch_length_safe()
    {
        WebhookSecrets.SecureEquals("a", "ab").Should().BeFalse();
    }

    [Fact]
    public void SecureEquals_rejects_null_or_empty()
    {
        WebhookSecrets.SecureEquals(null, "x").Should().BeFalse();
        WebhookSecrets.SecureEquals("x", "").Should().BeFalse();
    }

    [Fact]
    public void IsValidHmacSha256LowerHex_accepts_known_vector()
    {
        const string secret = "test-secret";
        const string body = """{"hello":"world"}""";
        string hex = ComputeHmacHex(secret, body);

        WebhookSecrets.IsValidHmacSha256LowerHex(secret, body, hex).Should().BeTrue();
    }

    [Fact]
    public void TimestampWithinSkew_rejects_when_skew_required_but_missing_header()
    {
        WebhookSecrets.TimestampWithinSkew(DateTimeOffset.UtcNow, null, 60).Should().BeFalse();
    }

    [Fact]
    public void TimestampWithinSkew_accepts_recent_epoch()
    {
        long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        WebhookSecrets.TimestampWithinSkew(DateTimeOffset.UtcNow, now.ToString(), 120).Should().BeTrue();
    }

    private static string ComputeHmacHex(string secret, string body)
    {
        byte[] key = System.Text.Encoding.UTF8.GetBytes(secret);
        byte[] data = System.Text.Encoding.UTF8.GetBytes(body);
        byte[] mac = System.Security.Cryptography.HMACSHA256.HashData(key, data);

        return Convert.ToHexString(mac).ToLowerInvariant();
    }
}
