namespace ArchLucid.Application.OperationalErrors;

/// <summary>Path prefix exclusions for operational error capture noise reduction.</summary>
public static class OperationalErrorPathExclusion
{
    public static bool IsExcluded(string? requestPath, IReadOnlyList<string> excludePathPrefixes)
    {
        if (string.IsNullOrWhiteSpace(requestPath) || excludePathPrefixes.Count == 0)
            return false;

        string normalized = requestPath.Trim();

        foreach (string prefix in excludePathPrefixes)
        {
            if (string.IsNullOrWhiteSpace(prefix))
                continue;

            if (normalized.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
