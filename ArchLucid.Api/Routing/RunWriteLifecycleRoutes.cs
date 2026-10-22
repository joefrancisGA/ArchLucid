namespace ArchLucid.Api.Routing;

/// <summary>
///     Single source of truth for the canonical run-lifecycle WRITE routes
///     (TB-305 / ADR 0042; buyer nouns per ADR 0064).
///     The <c>v1/architecture/*</c> family is the only run-lifecycle write surface; this registry lets
///     <c>CanonicalRunWriteSurfaceArchitectureTests</c> fail the build if a new dual-write verb reappears on
///     <see cref="ArchLucid.Api.Controllers.Authority.RunsController" /> without an ADR-cited entry here.
/// </summary>
public static class RunWriteLifecycleRoutes
{
    /// <summary>One canonical run-lifecycle write operation and its registered route template.</summary>
    public sealed record RunWriteRoute(string Operation, string CanonicalTemplate);

    // Templates are the raw ASP.NET route patterns as registered on RunsController actions (leading slash agnostic).
    // Adding a second template for one of these operations is a deliberate, ADR-cited act.
    private static readonly IReadOnlyList<RunWriteRoute> RoutesInternal =
    [
        new RunWriteRoute("create", "v{version:apiVersion}/architecture/request"),
        new RunWriteRoute("execute", "v{version:apiVersion}/architecture/review/{runId}/execute"),
        new RunWriteRoute("finalize", "v{version:apiVersion}/architecture/review/{runId}/finalize"),
    ];

    /// <summary>All canonical run-lifecycle write operations.</summary>
    public static IReadOnlyList<RunWriteRoute> All => RoutesInternal;

    private static readonly HashSet<string> CanonicalTemplates =
        new(RoutesInternal.Select(route => Normalize(route.CanonicalTemplate)), StringComparer.OrdinalIgnoreCase);

    /// <summary>True when <paramref name="rawRouteTemplate" /> is a canonical run-lifecycle write route.</summary>
    public static bool IsCanonical(string? rawRouteTemplate) =>
        rawRouteTemplate is not null && CanonicalTemplates.Contains(Normalize(rawRouteTemplate));

    // Route RawText sometimes carries a leading slash (absolute attribute routes) and sometimes not (relative ones);
    // normalize both forms so comparisons are slash-insensitive.
    private static string Normalize(string template) => template.Trim().TrimStart('/');
}
