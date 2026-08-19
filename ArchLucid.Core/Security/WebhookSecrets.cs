using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.Security;

/// <summary>Constant-time-ish secret comparison and optional HMAC helpers for inbound webhooks.</summary>
public static class WebhookSecrets
{
    /// <summary>
    ///     Compares two shared secrets without early exit on length mismatch (hashes first so lengths align).
    ///     Returns <see langword="false" /> if either argument is null/empty.
    /// </summary>
    public static bool SecureEquals(string? provided, string? expected)
    {
        if (string.IsNullOrEmpty(provided) || string.IsNullOrEmpty(expected))
            return false;

        ReadOnlySpan<byte> a = SHA256.HashData(Encoding.UTF8.GetBytes(provided));
        ReadOnlySpan<byte> b = SHA256.HashData(Encoding.UTF8.GetBytes(expected));

        return CryptographicOperations.FixedTimeEquals(a, b);
    }

    /// <summary>
    ///     Verifies an inbound signature header: optional <c>sha256=</c> prefix (outbound
    ///     <c>X-ArchLucid-Webhook-Signature</c>) or raw lowercase hex (<c>X-ArchLucid-Signature</c>).
    /// </summary>
    public static bool IsValidHmacSha256Signature(string secret, string body, string? signatureHeaderValue)
    {
        if (string.IsNullOrWhiteSpace(signatureHeaderValue))
            return false;

        string trimmed = signatureHeaderValue.Trim();

        if (trimmed.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
            trimmed = trimmed["sha256=".Length..];

        return IsValidHmacSha256LowerHex(secret, body, trimmed);
    }

    /// <summary>
    ///     Verifies <paramref name="signatureHex" /> as lowercase hex of HMAC-SHA256(secret, body UTF-8 bytes).
    /// </summary>
    public static bool IsValidHmacSha256LowerHex(string secret, string body, string? signatureHex)
    {
        if (string.IsNullOrWhiteSpace(signatureHex))
            return false;

        byte[] key = Encoding.UTF8.GetBytes(secret);
        byte[] data = Encoding.UTF8.GetBytes(body);
        ReadOnlySpan<byte> mac = HMACSHA256.HashData(key, data);

        if (signatureHex.Length != mac.Length * 2)
            return false;

        Span<byte> decoded = stackalloc byte[mac.Length];

        for (int i = 0; i < mac.Length; i++)
        {
            int hi = ParseHexNibble(signatureHex[i * 2]);
            int lo = ParseHexNibble(signatureHex[(i * 2) + 1]);

            if (hi < 0 || lo < 0)
                return false;

            decoded[i] = (byte)((hi << 4) | lo);
        }

        return CryptographicOperations.FixedTimeEquals(mac, decoded);
    }

    /// <summary>
    ///     When <paramref name="unixSecondsRaw"/> is set, parses Unix seconds and ensures |now - ts| ≤ skew (when skew &gt; 0).
    /// </summary>
    public static bool TimestampWithinSkew(DateTimeOffset utcNow, string? unixSecondsRaw, int skewSeconds)
    {
        if (skewSeconds <= 0)
            return true;

        if (string.IsNullOrWhiteSpace(unixSecondsRaw))
            return false;

        if (!long.TryParse(unixSecondsRaw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out long unix))
            return false;

        DateTimeOffset payload = DateTimeOffset.FromUnixTimeSeconds(unix);
        double deltaSeconds = Math.Abs((utcNow - payload).TotalSeconds);

        return deltaSeconds <= skewSeconds;
    }

    private static int ParseHexNibble(char c)
    {
        if (c is >= '0' and <= '9')
            return c - '0';

        if (c is >= 'a' and <= 'f')
            return 10 + (c - 'a');

        if (c is >= 'A' and <= 'F')
            return 10 + (c - 'A');

        return -1;
    }
}
