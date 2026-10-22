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

        string normalized = path.TrimEnd('/');

        if (string.Equals(normalized, "/v1/learning/plans", StringComparison.OrdinalIgnoreCase))
            return InteractiveReadHangKind.LearningPlansList;

        if (IsArchitectureDraftGetPath(normalized))
            return InteractiveReadHangKind.ArchitectureDraftGet;

        return InteractiveReadHangKind.None;
    }

    public static bool IsArchitectureDraftGetPath(string normalizedPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedPath);

        const string prefix = "/v1/architecture/draft/";

        if (!normalizedPath.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return false;

        string rest = normalizedPath[prefix.Length..];

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
