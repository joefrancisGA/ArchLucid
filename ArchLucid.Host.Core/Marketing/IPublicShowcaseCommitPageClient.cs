using ArchLucid.Host.Core.Demo;

namespace ArchLucid.Host.Core.Marketing;

/// <summary>Read-only marketing bundle for a single run flagged for public showcase in SQL.</summary>
public interface IPublicShowcaseCommitPageClient
{
    /// <summary>Returns a commit-page-shaped JSON bundle for <paramref name="runId"/> when the run is public showcase.</summary>
    Task<DemoCommitPagePreviewResponse?> GetShowcaseCommitPageAsync(Guid runId, CancellationToken cancellationToken = default);
}
