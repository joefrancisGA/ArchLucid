namespace ArchLucid.Api.Security;

/// <summary>
///     Guards path-based middleware skip/allow rules against traversal-shaped URLs that keep the raw request path
///     while normalized prefixes would match a public or unscoped carve-out.
/// </summary>
public static class ApiPathSkipSafety
{
    /// <summary>
    ///     When <see langword="true" />, callers must not treat the request as matching a path prefix skip/allow rule.
    /// </summary>
    public static bool BlocksPathBasedSkip(string? rawPath)
    {
        if (string.IsNullOrEmpty(rawPath))
            return false;

        if (rawPath.Contains('\\', StringComparison.Ordinal))
            return true;

        if (rawPath.Contains("//", StringComparison.Ordinal))
            return true;

        if (rawPath.Contains("%2e", StringComparison.OrdinalIgnoreCase))
            return true;

        foreach (string segment in rawPath.Split('/', StringSplitOptions.RemoveEmptyEntries))
        {

            if (string.Equals(segment, ".", StringComparison.Ordinal)
                || string.Equals(segment, "..", StringComparison.Ordinal))
            {
                return true;
            }

            if (SegmentDecodesToDotOrDotDot(segment))
                return true;
        }

        return false;
    }

    /// <summary>
    ///     Applies <see cref="BlocksPathBasedSkip" /> to the raw path, then evaluates a prefix skip only when safe.
    /// </summary>
    public static bool SafeStartsWithSegments(PathString rawPath, string prefix, StringComparison comparison = StringComparison.OrdinalIgnoreCase)
    {
        if (BlocksPathBasedSkip(rawPath.Value))
            return false;

        return rawPath.StartsWithSegments(prefix, comparison);
    }

    private static bool SegmentDecodesToDotOrDotDot(string segment)
    {
        if (string.IsNullOrEmpty(segment))
            return false;

        string decoded;

        try
        {
            decoded = Uri.UnescapeDataString(segment);
        }
        catch (UriFormatException)
        {
            return false;
        }

        return string.Equals(decoded, ".", StringComparison.Ordinal)
            || string.Equals(decoded, "..", StringComparison.Ordinal);
    }
}
