namespace ArchLucid.Api.Routing;

/// <summary>
///     Single source of truth for the canonical run-lifecycle WRITE routes and their deprecated aliases (TB-305 / ADR 0042).
///     The canonical <c>v1/architecture/*</c> family is the live authority pipeline (ADR 0030); the <c>v1/runs/*</c> and
///     <c>v1/requests</c> aliases stay routable for backward compatibility but emit deprecation headers and must not gain
///     new behaviour. Because each alias shares the same MVC action as its canonical route, idempotency and audit keying are
///     unified by construction — this type lets tests pin that contract and prevents new dual-write verbs from appearing
///     silently.
/// </summary>
public static class RunWriteLifecycleRoutes
{
    /// <summary>Decision record cited in the <c>Link</c> header of deprecated-alias responses.</summary>
    public const string DeprecationAdr = "ADR-0042";

    /// <summary>One canonical run-lifecycle write operation together with its deprecated route alias template(s).</summary>
    public sealed record RunWriteRoute(
        string Operation,
        string CanonicalTemplate,
        IReadOnlyList<string> DeprecatedAliasTemplates);

    // Templates are the raw ASP.NET route patterns as registered on RunsController actions (leading slash agnostic).
    // Each canonical/alias pair is bound to ONE action method, so adding a new pair here is a deliberate, ADR-cited act.
    private static readonly IReadOnlyList<RunWriteRoute> RoutesInternal =
    [
        new RunWriteRoute(
            "create",
            "v{version:apiVersion}/architecture/request",
            ["v{version:apiVersion}/requests"]),
        new RunWriteRoute(
            "execute",
            "v{version:apiVersion}/architecture/run/{runId}/execute",
            ["v{version:apiVersion}/runs/{runId}/submit"]),
        new RunWriteRoute(
            "commit",
            "v{version:apiVersion}/architecture/run/{runId}/commit",
            ["v{version:apiVersion}/runs/{runId}/manifest/finalize"]),
    ];

    /// <summary>All canonical run-lifecycle write operations and their deprecated aliases.</summary>
    public static IReadOnlyList<RunWriteRoute> All => RoutesInternal;

    private static readonly HashSet<string> DeprecatedAliasTemplates =
        new(RoutesInternal.SelectMany(route => route.DeprecatedAliasTemplates).Select(Normalize),
            StringComparer.OrdinalIgnoreCase);

    private static readonly HashSet<string> CanonicalTemplates =
        new(RoutesInternal.Select(route => Normalize(route.CanonicalTemplate)), StringComparer.OrdinalIgnoreCase);

    /// <summary>True when <paramref name="rawRouteTemplate" /> is a deprecated run-lifecycle alias (leading slash ignored).</summary>
    public static bool IsDeprecatedAlias(string? rawRouteTemplate) =>
        rawRouteTemplate is not null && DeprecatedAliasTemplates.Contains(Normalize(rawRouteTemplate));

    /// <summary>True when <paramref name="rawRouteTemplate" /> is a canonical run-lifecycle write route.</summary>
    public static bool IsCanonical(string? rawRouteTemplate) =>
        rawRouteTemplate is not null && CanonicalTemplates.Contains(Normalize(rawRouteTemplate));

    /// <summary>Low-cardinality operation id (<c>create</c>, <c>execute</c>, <c>commit</c>) for a deprecated alias template.</summary>
    public static string? DeprecatedAliasOperation(string? rawRouteTemplate)
    {
        if (rawRouteTemplate is null)
            return null;

        string normalized = Normalize(rawRouteTemplate);

        return RoutesInternal
            .FirstOrDefault(route =>
                route.DeprecatedAliasTemplates.Any(alias =>
                    string.Equals(Normalize(alias), normalized, StringComparison.OrdinalIgnoreCase)))
            ?.Operation;
    }

    /// <summary>Maps a deprecated alias template to its canonical template, or <c>null</c> when not a known alias.</summary>
    public static string? CanonicalFor(string? rawRouteTemplate)
    {
        if (rawRouteTemplate is null)
            return null;

        string normalized = Normalize(rawRouteTemplate);

        return RoutesInternal
            .FirstOrDefault(route =>
                route.DeprecatedAliasTemplates.Any(alias =>
                    string.Equals(Normalize(alias), normalized, StringComparison.OrdinalIgnoreCase)))
            ?.CanonicalTemplate;
    }

    // Route RawText sometimes carries a leading slash (absolute attribute routes) and sometimes not (relative ones);
    // normalise both forms so comparisons are slash-insensitive.
    private static string Normalize(string template) => template.Trim().TrimStart('/');
}
