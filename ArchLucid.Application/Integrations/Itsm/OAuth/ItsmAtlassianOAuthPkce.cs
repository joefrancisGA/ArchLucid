using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.Integrations.Itsm.OAuth;

public static class ItsmAtlassianOAuthPkce
{
    public static (string CodeVerifier, string CodeChallenge) CreatePair()
    {
        byte[] verifierBytes = RandomNumberGenerator.GetBytes(32);
        string codeVerifier = Base64UrlEncode(verifierBytes);
        byte[] challengeBytes = SHA256.HashData(Encoding.ASCII.GetBytes(codeVerifier));
        string codeChallenge = Base64UrlEncode(challengeBytes);

        return (codeVerifier, codeChallenge);
    }

    public static string CreateOpaqueState()
    {
        byte[] stateBytes = RandomNumberGenerator.GetBytes(24);

        return Base64UrlEncode(stateBytes);
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
