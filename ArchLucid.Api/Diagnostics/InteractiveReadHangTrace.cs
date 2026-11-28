using ArchLucid.Core.Diagnostics;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Api.Diagnostics;

/// <summary>Classifies GET paths that emit temporary hang breadcrumbs to stderr.</summary>
public static class InteractiveReadHangTrace
{
    public static InteractiveReadHangKind Classify(string? method, string? path)
    {
        if (!string.Equals(method, HttpMethods.Get, StringComparison.OrdinalIgnoreCase))
            return InteractiveReadHangKind.None;

        if (string.IsNullOrWhiteSpace(path))
            return InteractiveReadHangKind.None;

        ReadOnlySpan<char> route = StripVersionOnePrefix(path.TrimEnd('/'));

        if (route.Equals("/learning/plans", StringComparison.OrdinalIgnoreCase))
            return InteractiveReadHangKind.LearningPlansList;

        if (IsArchitectureDraftGetRoute(route))
            return InteractiveReadHangKind.ArchitectureDraftGet;

        return InteractiveReadHangKind.None;
    }

    public static bool IsArchitectureDraftGetPath(string normalizedPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedPath);

        return IsArchitectureDraftGetRoute(StripVersionOnePrefix(normalizedPath));
    }

    private static ReadOnlySpan<char> StripVersionOnePrefix(string path)
    {
        if (path.StartsWith("/v1/", StringComparison.OrdinalIgnoreCase))
            return path.AsSpan("/v1".Length);

        if (path.StartsWith("/v1.0/", StringComparison.OrdinalIgnoreCase))
            return path.AsSpan("/v1.0".Length);

        return default;
    }

    private static bool IsArchitectureDraftGetRoute(ReadOnlySpan<char> route)
    {
        const string prefix = "/architecture/draft/";

        if (!route.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        ReadOnlySpan<char> rest = route[prefix.Length..];

        // Nested routes (/questions, /admit, /submit) are not the Resume-latest-draft hang path.
        if (rest.Contains('/'))
            return false;

        return Guid.TryParse(rest, out _);
    }

    public static string ResolveComponent(InteractiveReadHangKind kind)
    {
        return kind switch
        {
            InteractiveReadHangKind.LearningPlansList => LearningPlansHangDiagnostics.Component,
            InteractiveReadHangKind.ArchitectureDraftGet => DraftGetHangDiagnostics.Component,
            InteractiveReadHangKind.None => throw new ArgumentOutOfRangeException(nameof(kind)),
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown interactive read hang kind.")
        };
    }
}
