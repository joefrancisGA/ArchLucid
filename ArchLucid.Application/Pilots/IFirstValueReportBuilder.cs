namespace ArchLucid.Application.Pilots;

/// <summary>Markdown first-value report for a run (Confluence publisher and HTTP pilots depend on this surface).</summary>
public interface IFirstValueReportBuilder
{
    Task<string?> BuildMarkdownAsync(string runId, string apiBaseForLinks, CancellationToken cancellationToken = default);
}
