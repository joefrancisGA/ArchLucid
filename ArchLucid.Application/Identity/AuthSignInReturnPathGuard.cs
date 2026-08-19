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

        if (ContainsControlCharacter(candidate))
        {
            return null;
        }

        string? normalized = TryNormalizeRelativePath(candidate);

        if (normalized is null)
            return null;

        return TryNormalizeAfterPercentDecoding(candidate, normalized);
    }

    private static string? TryNormalizeRelativePath(string candidate)
    {
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

    private static string? TryNormalizeAfterPercentDecoding(string candidate, string normalized)
    {
        string working = candidate;

        for (int decodePass = 0; decodePass < 3 && working.Contains('%', StringComparison.Ordinal); decodePass++)
        {
            string decoded;

            try
            {
                decoded = Uri.UnescapeDataString(working);
            }
            catch (UriFormatException)
            {
                return null;
            }

            if (string.Equals(decoded, working, StringComparison.Ordinal))
                break;

            if (ContainsControlCharacter(decoded))
                return null;

            string? decodedNormalized = TryNormalizeRelativePath(decoded);

            if (decodedNormalized is null)
                return null;

            working = decoded;
            normalized = decodedNormalized;
        }

        return normalized;
    }

    private static bool ContainsControlCharacter(string candidate)
    {
        foreach (char ch in candidate)
        {
            if (char.IsControl(ch))
            {
                return true;
            }
        }

        return false;
    }
}
