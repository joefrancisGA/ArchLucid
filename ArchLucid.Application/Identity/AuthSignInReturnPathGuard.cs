namespace ArchLucid.Application.Identity;

/// <summary>Prevents open redirects while preserving in-app return paths.</summary>
public static class AuthSignInReturnPathGuard
{
    private const int MaxPercentDecodePasses = 8;

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
            || ContainsProtocolRelativeTraversal(candidate)
            || ContainsSlashHomoglyph(candidate)
            || candidate.Contains('\\', StringComparison.Ordinal)
            || candidate.Contains('@', StringComparison.Ordinal)
            || candidate.Contains("://", StringComparison.Ordinal))
        {
            return null;
        }

        return candidate;
    }

    private static bool ContainsProtocolRelativeTraversal(string path)
    {
        return path.StartsWith("//", StringComparison.Ordinal)
            || path.StartsWith("/\\", StringComparison.Ordinal)
            || path.Contains("//", StringComparison.Ordinal)
            || path.Contains("/\\", StringComparison.Ordinal);
    }

    private static string? TryNormalizeAfterPercentDecoding(string candidate, string normalized)
    {
        string working = candidate;

        for (int decodePass = 0; decodePass < MaxPercentDecodePasses && working.Contains('%', StringComparison.Ordinal); decodePass++)
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

        if (ContainsResidualEncodedTraversal(working))
            return null;

        return normalized;
    }

    private static bool ContainsResidualEncodedTraversal(string candidate)
    {
        string working = candidate;

        for (int decodePass = 0; decodePass < MaxPercentDecodePasses && working.Contains('%', StringComparison.Ordinal); decodePass++)
        {
            if (ContainsPercentEncodedPathSeparator(working))
                return true;

            string decoded;

            try
            {
                decoded = Uri.UnescapeDataString(working);
            }
            catch (UriFormatException)
            {
                return true;
            }

            if (string.Equals(decoded, working, StringComparison.Ordinal))
                break;

            if (ContainsProtocolRelativeTraversal(decoded)
                || ContainsSlashHomoglyph(decoded)
                || decoded.Contains('\\', StringComparison.Ordinal)
                || decoded.Contains('@', StringComparison.Ordinal)
                || decoded.Contains("://", StringComparison.Ordinal))
            {
                return true;
            }

            working = decoded;
        }

        return ContainsPercentEncodedPathSeparator(working);
    }

    private static bool ContainsPercentEncodedPathSeparator(string candidate)
    {
        string lower = candidate.ToLowerInvariant();

        return lower.Contains("%2f", StringComparison.Ordinal)
            || lower.Contains("%5c", StringComparison.Ordinal)
            || lower.Contains("%2e", StringComparison.Ordinal);
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

    private static bool ContainsSlashHomoglyph(string candidate)
    {
        foreach (char ch in candidate)
        {
            if (IsSlashHomoglyph(ch))
            {
                return true;
            }
        }

        return false;
    }

    // Browsers may normalize these to "/" or "\\" and treat the path as protocol-relative.
    private static bool IsSlashHomoglyph(char ch) =>
        ch == '\uFF0F' // ／ FULLWIDTH SOLIDUS
        || ch == '\uFF3C' // ＼ FULLWIDTH REVERSE SOLIDUS
        || ch == '\u2215' // ∕ DIVISION SLASH
        || ch == '\u2044' // ⁄ FRACTION SLASH
        || ch == '\uFE68'; // ﹨ SMALL REVERSE SOLIDUS
}
