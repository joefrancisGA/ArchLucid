namespace ArchLucid.Application.Pilots;
/// <summary>
///     Pre-rendered markdown fragments for <see cref = "WhyArchLucidPackBuilder"/> — populated by the API from
///     <c>GET /v1/demo/preview</c> data so Application stays free of <c>ArchLucid.Host.Core.Demo</c> types.
/// </summary>
public sealed record WhyArchLucidPackSourceDto(string RunId, string ProjectId, string ManifestSectionMarkdown, string AuthorityChainSectionMarkdown, string ArtifactsSectionMarkdown, string PipelineTimelineSectionMarkdown, string RunExplanationSectionMarkdown, string CitationsSectionMarkdown, string ComparisonDeltaSampleMarkdown)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(RunId, ProjectId, ManifestSectionMarkdown, AuthorityChainSectionMarkdown, ArtifactsSectionMarkdown, PipelineTimelineSectionMarkdown, RunExplanationSectionMarkdown, CitationsSectionMarkdown, ComparisonDeltaSampleMarkdown);
    private static byte __ValidatePrimaryConstructorArguments(System.String runId, System.String projectId, System.String manifestSectionMarkdown, System.String authorityChainSectionMarkdown, System.String artifactsSectionMarkdown, System.String pipelineTimelineSectionMarkdown, System.String runExplanationSectionMarkdown, System.String citationsSectionMarkdown, System.String comparisonDeltaSampleMarkdown)
    {
        ArgumentNullException.ThrowIfNull(runId);
        ArgumentNullException.ThrowIfNull(projectId);
        ArgumentNullException.ThrowIfNull(manifestSectionMarkdown);
        ArgumentNullException.ThrowIfNull(authorityChainSectionMarkdown);
        ArgumentNullException.ThrowIfNull(artifactsSectionMarkdown);
        ArgumentNullException.ThrowIfNull(pipelineTimelineSectionMarkdown);
        ArgumentNullException.ThrowIfNull(runExplanationSectionMarkdown);
        ArgumentNullException.ThrowIfNull(citationsSectionMarkdown);
        ArgumentNullException.ThrowIfNull(comparisonDeltaSampleMarkdown);
        return (byte)0;
    }
}