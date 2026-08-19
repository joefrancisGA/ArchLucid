using System.Security.Cryptography;

namespace ArchLucid.Application.Admin;

public static class InvitationTokenGenerator
{
    private const int TokenByteLength = 32;

    public static string GenerateUrlSafeToken()
    {
        byte[] bytes = RandomNumberGenerator.GetBytes(TokenByteLength);

        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
