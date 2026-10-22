using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Bounds agent reasoning text copied into finding explainability (TB-055).</summary>
public static class ReasoningTraceBounds
{
    public const int MaxStoredCharacters = 2000;

    public static (string? StoredTrace, string? DigestSha256) Normalize(string? reasoningTrace)
    {
        if (string.IsNullOrWhiteSpace(reasoningTrace))
            return (null, null);

        string trimmed = reasoningTrace.Trim();

        if (trimmed.Length <= MaxStoredCharacters)
            return (trimmed, null);

        string digest = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(trimmed)));
        string stored = trimmed[..MaxStoredCharacters];

        return (stored, digest);
    }
}
