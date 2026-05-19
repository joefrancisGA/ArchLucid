using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Host.Core.Startup.Tracing;

/// <summary>
///     Maps configured <see cref="System.Diagnostics.ActivitySource" /> names to span-name heuristics used at head sampling
///     time (the .NET SDK does not pass source name on <see cref="OpenTelemetry.Trace.SamplingParameters" />).
/// </summary>
internal static class AlwaysSampleActivitySourceSpanMatcher
{
    /// <summary>
    ///     Returns whether <paramref name="spanName" /> belongs to <paramref name="activitySourceName" /> per ArchLucid
    ///     naming conventions.
    /// </summary>
    public static bool Matches(string activitySourceName, string? spanName)
    {
        if (string.IsNullOrEmpty(activitySourceName))
            return false;

        if (string.Equals(activitySourceName, ArchLucidInstrumentation.AuthorityRun.Name, StringComparison.Ordinal))
            return IsAuthorityRunSpanName(spanName);

        return false;
    }

    /// <summary>Returns whether <paramref name="spanName" /> matches any configured always-sample source.</summary>
    public static bool MatchesAny(IReadOnlyList<string> activitySourceNames, string? spanName)
    {
        for (int i = 0; i < activitySourceNames.Count; i++)
        {
            if (Matches(activitySourceNames[i], spanName))
                return true;
        }

        return false;
    }

    private static bool IsAuthorityRunSpanName(string? spanName)
    {
        if (string.IsNullOrEmpty(spanName))
            return false;

        // Stage spans use authority.*; root runs use authority.run (also matched by the prefix).
        return spanName.StartsWith("authority.", StringComparison.Ordinal);
    }
}
