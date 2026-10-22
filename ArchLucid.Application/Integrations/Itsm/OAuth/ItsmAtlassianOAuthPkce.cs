using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Codecs;

namespace ArchLucid.Application.Integrations.Itsm.OAuth;

public static class ItsmAtlassianOAuthPkce
{
    public static (string CodeVerifier, string CodeChallenge) CreatePair()
    {
        byte[] verifierBytes = RandomNumberGenerator.GetBytes(32);
        string codeVerifier = Base64UrlCodec.Encode(verifierBytes);
        byte[] challengeBytes = SHA256.HashData(Encoding.ASCII.GetBytes(codeVerifier));
        string codeChallenge = Base64UrlCodec.Encode(challengeBytes);

        return (codeVerifier, codeChallenge);
    }

    public static string CreateOpaqueState()
    {
        byte[] stateBytes = RandomNumberGenerator.GetBytes(24);

        return Base64UrlCodec.Encode(stateBytes);
    }
}
