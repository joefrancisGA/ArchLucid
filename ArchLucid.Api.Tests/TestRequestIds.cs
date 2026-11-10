using System.Runtime.CompilerServices;

namespace ArchLucid.Api.Tests;

/// <summary>Stable, parallel-safe architecture request ids for SQL integration tests.</summary>
public static class TestRequestIds
{
    /// <summary>REQ-{scenario}-{suffix} using the calling test name (sanitized).</summary>
    public static string ForScenario(string scenario, [CallerMemberName] string testMethod = "") =>
        $"REQ-{Sanitize(scenario)}-{Sanitize(testMethod)}";

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
