using System.Text.RegularExpressions;

namespace ArchLucid.Application.Identity;

/// <summary>Validates customer-facing workspace display names (no HTML/script; safe slug inputs).</summary>
public static partial class WorkspaceNameValidator
{
    public const int MinLength = 2;

    public const int MaxLength = 120;

    [GeneratedRegex(@"^[a-zA-Z0-9][a-zA-Z0-9\s\-'.&()]*[a-zA-Z0-9)]$|^[a-zA-Z0-9]$", RegexOptions.CultureInvariant)]
    private static partial Regex AllowedPattern();

    public static bool TryValidate(string? workspaceName, out string normalized, out string customerMessage)
    {
        normalized = workspaceName?.Trim() ?? string.Empty;

        if (normalized.Length < MinLength)
        {
            customerMessage = $"Workspace name must be at least {MinLength} characters.";

            return false;
        }

        if (normalized.Length > MaxLength)
        {
            customerMessage = $"Workspace name must be at most {MaxLength} characters.";

            return false;
        }

        if (normalized.Contains('<', StringComparison.Ordinal) || normalized.Contains('>', StringComparison.Ordinal))
        {
            customerMessage = "Workspace name cannot include angle brackets.";

            return false;
        }

        if (!AllowedPattern().IsMatch(normalized))
        {
            customerMessage =
                "Workspace name can use letters, numbers, spaces, and common punctuation (hyphens, apostrophes, periods, parentheses).";

            return false;
        }

        customerMessage = string.Empty;

        return true;
    }
}
