namespace ArchLucid.Host.Core.Startup.Validation.Rules;

/// <summary>
/// Detects API key strings that are unsuitable for Production when API key authentication is enabled.
/// Callers must not log values passed here.
/// </summary>
internal static class ApiKeyPlaceholderValue
{
    /// <summary>
    /// Minimum length (24 characters after trim). Shorter non-empty keys are rejected in Production so operators
    /// cannot deploy trivially guessable secrets; entropy from random generators typically exceeds this.
    /// </summary>
    private const int MinimumProductionKeyLength = 24;

    private static readonly string[] ObviousPlaceholderTokens =
    [
        "changeme",
        "placeholder",
        "your-api-key",
        "replace-me",
        "secret",
        "test",
        "admin",
        "password",
    ];

    /// <summary>
    /// Returns whether <paramref name="value"/> should be treated as a placeholder or weak key for Production.
    /// Null, empty, and whitespace-only yield <c>false</c> (empty keys are validated separately).
    /// </summary>
    internal static bool IsPlaceholderValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();

        foreach (string token in ObviousPlaceholderTokens)
        {
            if (string.Equals(trimmed, token, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        if (trimmed.Length < MinimumProductionKeyLength)
        {
            return true;
        }

        return false;
    }
}
