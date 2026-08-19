using ArchLucid.Core.Connectors.Publishing;

namespace ArchLucid.Application.Integrations.Confluence;

/// <summary>Admin-triggered publish of first-value Markdown to Confluence Cloud.</summary>
public interface IConfluenceFirstValueReportPublisher
{
    /// <summary>
    ///     Resolves the run without tenant-scoped HTTP context (admin SQL path), builds first-value Markdown under ambient
    ///     scope, and creates a Confluence page.
    /// </summary>
    Task<PublishOutcome> PublishFirstValueReportAsync(string runId, string apiBaseForLinks, CancellationToken cancellationToken);
}
