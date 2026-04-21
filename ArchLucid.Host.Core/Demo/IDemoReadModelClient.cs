namespace ArchLucid.Host.Core.Demo;

/// <summary>
/// Server-side read-model client that powers the operator-shell <c>/demo/explain</c> route.
/// Resolves the latest committed demo-seed run, then composes the citations-bound aggregate
/// explanation and the provenance graph for that run, hard-pinned to the demo tenant scope.
/// </summary>
/// <remarks>
/// <para>
/// This client never reads from the inbound request scope. It does not relax authorization
/// on the underlying <c>/v1/explain</c> or <c>/v1/provenance</c> controllers — instead it
/// composes the same application services they use, but only for the demo tenant.
/// </para>
/// <para>
/// Implementations must return <see langword="null"/> when no committed demo run exists
/// (callers translate this to <c>404 Not Found</c>), and must never raise on missing data.
/// </para>
/// </remarks>
public interface IDemoReadModelClient
{
    /// <summary>
    /// Builds the side-by-side demo explain payload, or <see langword="null"/> when no committed
    /// demo-seed run is available (e.g. the seed has not been applied yet on this host).
    /// </summary>
    Task<DemoExplainResponse?> GetLatestCommittedDemoExplainAsync(CancellationToken cancellationToken = default);
}
