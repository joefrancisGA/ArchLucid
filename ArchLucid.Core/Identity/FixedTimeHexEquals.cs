using System.Security.Cryptography;
using System.Text;

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
            byte[] leftUtf8 = Encoding.UTF8.GetBytes(left.ToString());
            byte[] rightUtf8 = Encoding.UTF8.GetBytes(right.ToString());

            return leftUtf8.Length == rightUtf8.Length
                && CryptographicOperations.FixedTimeEquals(leftUtf8, rightUtf8);
        }
    }
}
