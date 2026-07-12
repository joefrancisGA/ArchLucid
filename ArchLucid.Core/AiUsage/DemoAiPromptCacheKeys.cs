using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.AiUsage;

public static class DemoAiPromptCacheKeys
{
    public static string Build(string? systemPrompt, string? userPrompt)
    {
        string payload = $"{systemPrompt ?? string.Empty}\n---\n{userPrompt ?? string.Empty}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
    }
}
