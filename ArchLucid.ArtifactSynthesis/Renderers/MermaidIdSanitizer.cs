using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.ArtifactSynthesis.Renderers;

public static class MermaidIdSanitizer
{
    public static string Sanitize(string rawId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(rawId);

        if (IsSimpleMermaidId(rawId))
        {
            return rawId;
        }

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(rawId));

        return "n_" + Convert.ToHexString(hash.AsSpan(0, 8)).ToLowerInvariant();
    }

    private static bool IsSimpleMermaidId(string rawId)
    {
        if (rawId.Length == 0 || rawId.Length > 64)
        {
            return false;
        }

        for (int index = 0; index < rawId.Length; index++)
        {
            char character = rawId[index];

            if (char.IsLetterOrDigit(character) || character == '_')
            {
                continue;
            }

            return false;
        }

        return char.IsLetter(rawId[0]);
    }
}
