using System.Security.Cryptography;

namespace ArchLucid.Core.Authentication;

/// <summary>Generates cryptographically random API key material.</summary>
public static class ApiKeyMaterialGenerator
{
    public const int DefaultKeyByteLength = 32;

    public static string GenerateHexKey(int byteLength = DefaultKeyByteLength)
    {
        if (byteLength < 16)
            throw new ArgumentOutOfRangeException(nameof(byteLength), "API key length must be at least 16 bytes.");

        byte[] bytes = new byte[byteLength];

        RandomNumberGenerator.Fill(bytes);

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
