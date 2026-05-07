namespace ArchLucid.Application.Pilots;
/// <summary>
///     Pre-rendered markdown fragments for <see cref = "WhyArchLucidPackBuilder"/> — populated by the API from
///     <c>GET /v1/demo/preview</c> data so Application stays free of <c>ArchLucid.Host.Core.Demo</c> types.
/// </summary>
public sealed record WhyArchLucidPackSourceDto
{
    public string RunId { get; init; }
    public string ProjectId { get; init; }
    public string ManifestSectionMarkdown { get; init; }
    public string AuthorityChainSectionMarkdown { get; init; }
    public string ArtifactsSectionMarkdown { get; init; }
    public string PipelineTimelineSectionMarkdown { get; init; }
    public string RunExplanationSectionMarkdown { get; init; }
    public string CitationsSectionMarkdown { get; init; }
    public string ComparisonDeltaSampleMarkdown { get; init; }

    public WhyArchLucidPackSourceDto(string runId, string projectId, string manifestSectionMarkdown, string authorityChainSectionMarkdown, string artifactsSectionMarkdown, string pipelineTimelineSectionMarkdown, string runExplanationSectionMarkdown, string citationsSectionMarkdown, string comparisonDeltaSampleMarkdown)
    {
        RunId = runId ?? throw new ArgumentNullException(nameof(runId));
        ProjectId = projectId ?? throw new ArgumentNullException(nameof(projectId));
        ManifestSectionMarkdown = manifestSectionMarkdown ?? throw new ArgumentNullException(nameof(manifestSectionMarkdown));
        AuthorityChainSectionMarkdown = authorityChainSectionMarkdown ?? throw new ArgumentNullException(nameof(authorityChainSectionMarkdown));
        ArtifactsSectionMarkdown = artifactsSectionMarkdown ?? throw new ArgumentNullException(nameof(artifactsSectionMarkdown));
        PipelineTimelineSectionMarkdown = pipelineTimelineSectionMarkdown ?? throw new ArgumentNullException(nameof(pipelineTimelineSectionMarkdown));
        RunExplanationSectionMarkdown = runExplanationSectionMarkdown ?? throw new ArgumentNullException(nameof(runExplanationSectionMarkdown));
        CitationsSectionMarkdown = citationsSectionMarkdown ?? throw new ArgumentNullException(nameof(citationsSectionMarkdown));
        ComparisonDeltaSampleMarkdown = comparisonDeltaSampleMarkdown ?? throw new ArgumentNullException(nameof(comparisonDeltaSampleMarkdown));
    }
}