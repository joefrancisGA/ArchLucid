namespace ArchLucid.Host.Core.Demo;

/// <summary>
/// Anonymous, feature-gated read model that bundles the operator commit-page projections for the latest committed demo-seed run.
/// </summary>
/// <remarks>
/// Hard-pinned to <see cref="DemoScopes.BuildDemoScope"/> — same services as authoritative controllers, never widens auth on them.
/// Returns <see langword="null"/> when no committed demo run exists or required sub-payloads are missing.
/// </remarks>
public interface IDemoCommitPagePreviewClient
{
    /// <summary>Materializes the full preview bundle or <see langword="null"/> when unavailable.</summary>
    Task<DemoCommitPagePreviewResponse?> GetLatestCommittedDemoCommitPageAsync(CancellationToken cancellationToken = default);
}
