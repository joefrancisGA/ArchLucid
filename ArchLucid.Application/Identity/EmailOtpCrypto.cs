using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public static class EmailOtpCodeGenerator
{
    public static string GenerateNumericCode(int length)
    {
        if (length < 4 || length > 10)
        {
            throw new ArgumentOutOfRangeException(nameof(length));
        }

        int max = (int)Math.Pow(10, length);
        int value = RandomNumberGenerator.GetInt32(0, max);

        return value.ToString($"D{length}", System.Globalization.CultureInfo.InvariantCulture);
    }
}

public static class EmailOtpCodeHasher
{
    public static string Hash(Guid challengeId, string rawCode, string? pepper)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawCode);

        string payload = $"{challengeId:D}:{rawCode.Trim()}";

        if (!string.IsNullOrWhiteSpace(pepper))
        {
            payload = $"{pepper.Trim()}:{payload}";
        }

        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(bytes);
    }

    /// <summary>Constant-time compare for stored OTP code hashes (hex SHA-256).</summary>
    public static bool FixedTimeEqualsHex(string? leftHex, string? rightHex) =>
        FixedTimeHexEquals.Equals(leftHex, rightHex);
}

public static class EmailOtpRequestMetadataHasher
{
    public static string? HashOptional(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value.Trim()));

        return Convert.ToHexString(bytes)[..16].ToLowerInvariant();
    }
}

public static class EmailOtpCorrelationFingerprint
{
    private const int HexPrefixLength = 12;

    public static string ComputeHexPrefix(string normalizedEmail)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedEmail);

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedEmail.Trim().ToLowerInvariant()));
        string hex = Convert.ToHexString(hash).ToLowerInvariant();

        return hex.Length <= HexPrefixLength ? hex : hex[..HexPrefixLength];
    }
}

public static class EmailOtpInvitationTokenHasher
{
    public static byte[] Hash(string rawToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawToken);

        return SHA256.HashData(Encoding.UTF8.GetBytes(rawToken.Trim()));
    }
}
