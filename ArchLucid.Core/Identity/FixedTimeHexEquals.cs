using System.Security.Cryptography;

namespace ArchLucid.Core.Identity;

/// <summary>Constant-time equality for hex-encoded digests (OTP hashes, fingerprints).</summary>
public static class FixedTimeHexEquals
{
    public static bool Equals(string? leftHex, string? rightHex)
    {
        if (string.IsNullOrWhiteSpace(leftHex) || string.IsNullOrWhiteSpace(rightHex))
        {
            return false;
        }

        ReadOnlySpan<char> left = leftHex.AsSpan().Trim();
        ReadOnlySpan<char> right = rightHex.AsSpan().Trim();

        if (left.Length != right.Length)
        {
            return false;
        }

        try
        {
            byte[] leftBytes = Convert.FromHexString(left);
            byte[] rightBytes = Convert.FromHexString(right);

            return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
        }
        catch (FormatException)
        {
            // Invalid digest encodings must never compare equal.
            return false;
        }
    }
}
