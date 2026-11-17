using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Api.Tests;

/// <summary>Stable, parallel-safe architecture request ids for SQL integration tests.</summary>
public static class TestRequestIds
{
    // Intake allows 64 characters, but SystemNameForRequest uses only the first 48
    // characters when deriving review names. Keep the disambiguating hash inside
    // that window so long test names remain both valid and distinct.
    private const int MaxSystemNameSeedLength = 48;
    private const int HashLength = 12;

    /// <summary>REQ-{scenario}-{test method}, with a stable hash for long scenario names.</summary>
    public static string ForScenario(string scenario, [CallerMemberName] string testMethod = "")
    {
        string requestId = $"REQ-{Sanitize(scenario)}-{Sanitize(testMethod)}";

        if (requestId.Length <= MaxSystemNameSeedLength)
            return requestId;

        string hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(requestId)))[..HashLength];
        return $"{requestId[..(MaxSystemNameSeedLength - HashLength - 1)]}-{hash}";
    }

    /// <summary>Unique idempotency key prefix for parallel SQL intake tests.</summary>
    public static string IdempotencyKey(string prefix) =>
        $"{Sanitize(prefix)}-{Guid.NewGuid():N}";

    private static string Sanitize(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "UNNAMED";

        Span<char> buffer = stackalloc char[value.Length];
        int length = 0;

        foreach (char c in value)
        {
            if (char.IsAsciiLetterOrDigit(c))
            {
                buffer[length++] = char.ToUpperInvariant(c);

                continue;
            }

            if (c is '_' or '-' && length > 0 && buffer[length - 1] != '-')
                buffer[length++] = '-';
        }

        if (length == 0)
            return "UNNAMED";

        ReadOnlySpan<char> trimmed = buffer[..length].Trim('-');

        return trimmed.Length == 0 ? "UNNAMED" : trimmed.ToString();
    }
}
