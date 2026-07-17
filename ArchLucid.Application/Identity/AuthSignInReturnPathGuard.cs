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

        if (!candidate.StartsWith("/", StringComparison.Ordinal)
            || candidate.StartsWith("//", StringComparison.Ordinal)
            || candidate.Contains('\\', StringComparison.Ordinal)
            || candidate.Contains('@', StringComparison.Ordinal))
        {
            return null;
        }

        return candidate;
    }
}
