namespace ArchLucid.Application.Identity;

/// <summary>Prevents open redirects while preserving in-app return paths.</summary>
public static class AuthSignInReturnPathGuard
{
    public static string? TryNormalize(string? returnPath)
    {
        if (string.IsNullOrWhiteSpace(returnPath))
        {
            return null;
        }

        string candidate = returnPath.Trim();

        // Reject control-character smuggling used to bypass naive startsWith("/") checks.
        foreach (char ch in candidate)
        {
            if (char.IsControl(ch))
            {
                return null;
            }
        }

        if (!candidate.StartsWith("/", StringComparison.Ordinal)
            || candidate.StartsWith("//", StringComparison.Ordinal)
            || candidate.StartsWith("/\\", StringComparison.Ordinal)
            || candidate.Contains('\\', StringComparison.Ordinal)
            || candidate.Contains('@', StringComparison.Ordinal)
            || candidate.Contains("://", StringComparison.Ordinal))
        {
            return null;
        }

        return candidate;
    }
}
