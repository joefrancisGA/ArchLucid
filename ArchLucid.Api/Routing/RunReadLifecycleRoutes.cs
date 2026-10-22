namespace ArchLucid.Api.Routing;

/// <summary>
///     Canonical product-facing run READ routes under <c>/v1/runs/*</c> (REST API redesign; complements ADR 0064
///     <c>/v1/architecture/*</c> operator reads on <see cref="Controllers.Authority.RunQueryController" />).
///     Legacy <c>/v1/authority/reviews/*</c> aliases remain for one release window and delegate here.
/// </summary>
public static class RunReadLifecycleRoutes
{
    /// <summary>One canonical run read operation and its registered route template.</summary>
    public sealed record RunReadRoute(string Operation, string CanonicalTemplate);

    private static readonly IReadOnlyList<RunReadRoute> RoutesInternal =
    [
        new RunReadRoute("list", "v{version:apiVersion}/runs"),
        new RunReadRoute("detail", "v{version:apiVersion}/runs/{runId:guid}"),
        new RunReadRoute("manifest", "v{version:apiVersion}/runs/{runId:guid}/manifest"),
        new RunReadRoute("review-trail", "v{version:apiVersion}/runs/{runId:guid}/review-trail"),
        new RunReadRoute("review-trail-rationale", "v{version:apiVersion}/runs/{runId:guid}/review-trail/rationale"),
        new RunReadRoute("review-trail-provenance", "v{version:apiVersion}/runs/{runId:guid}/review-trail/provenance"),
        new RunReadRoute("review-trail-export", "v{version:apiVersion}/runs/{runId:guid}/review-trail/export"),
        new RunReadRoute("findings", "v{version:apiVersion}/runs/{runId}/findings"),
    ];

    /// <summary>All canonical <c>/v1/runs/*</c> read operations.</summary>
    public static IReadOnlyList<RunReadRoute> All => RoutesInternal;

    private static readonly HashSet<string> CanonicalTemplates =
        new(RoutesInternal.Select(route => Normalize(route.CanonicalTemplate)), StringComparer.OrdinalIgnoreCase);

    /// <summary>True when <paramref name="rawRouteTemplate" /> is a canonical <c>/v1/runs/*</c> read route.</summary>
    public static bool IsCanonical(string? rawRouteTemplate) =>
        rawRouteTemplate is not null && CanonicalTemplates.Contains(Normalize(rawRouteTemplate));

    private static string Normalize(string template) => template.Trim().TrimStart('/');
}
