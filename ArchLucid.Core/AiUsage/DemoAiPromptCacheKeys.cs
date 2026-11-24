using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Core.AiUsage;

public static class DemoAiPromptCacheKeys
{
    public static string Build(string? systemPrompt, string? userPrompt)
    {
        string system = systemPrompt ?? string.Empty;
        string user = userPrompt ?? string.Empty;

        // Length-prefix the system prompt so delimiters inside either prompt cannot alias another pair.
        string payload = system.Length.ToString(CultureInfo.InvariantCulture) + ":" + system + user;
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexString(hash);
    }
}
