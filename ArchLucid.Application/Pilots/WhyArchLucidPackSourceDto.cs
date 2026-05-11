namespace ArchLucid.Application.Pilots;

/// <summary>
///     Pre-rendered markdown fragments for <see cref = "WhyArchLucidPackBuilder"/> — populated by the API from
///     <c>GET /v1/demo/preview</c> data so Application stays free of <c>ArchLucid.Host.Core.Demo</c> types.
/// </summary>
public sealed record WhyArchLucidPackSourceDto(
    string RunId,
    string ProjectId,
    string ManifestSectionMarkdown,
    string AuthorityChainSectionMarkdown,
    string ArtifactsSectionMarkdown,
    string PipelineTimelineSectionMarkdown,
    string RunExplanationSectionMarkdown,
    string CitationsSectionMarkdown,
    string ComparisonDeltaSampleMarkdown)
{
    public string RunId
    {
        get;
        init;
    } = RunId ?? throw new ArgumentNullException(nameof(RunId));

    public string ProjectId
    {
        get;
        init;
    } = ProjectId ?? throw new ArgumentNullException(nameof(ProjectId));

    public string ManifestSectionMarkdown
    {
        get;
        init;
    } = ManifestSectionMarkdown ?? throw new ArgumentNullException(nameof(ManifestSectionMarkdown));

    public string AuthorityChainSectionMarkdown
    {
        get;
        init;
    } = AuthorityChainSectionMarkdown ?? throw new ArgumentNullException(nameof(AuthorityChainSectionMarkdown));

    public string ArtifactsSectionMarkdown
    {
        get;
        init;
    } = ArtifactsSectionMarkdown ?? throw new ArgumentNullException(nameof(ArtifactsSectionMarkdown));

    public string PipelineTimelineSectionMarkdown
    {
        get;
        init;
    } = PipelineTimelineSectionMarkdown ?? throw new ArgumentNullException(nameof(PipelineTimelineSectionMarkdown));

    public string RunExplanationSectionMarkdown
    {
        get;
        init;
    } = RunExplanationSectionMarkdown ?? throw new ArgumentNullException(nameof(RunExplanationSectionMarkdown));

    public string CitationsSectionMarkdown
    {
        get;
        init;
    } = CitationsSectionMarkdown ?? throw new ArgumentNullException(nameof(CitationsSectionMarkdown));

    public string ComparisonDeltaSampleMarkdown
    {
        get;
        init;
    } = ComparisonDeltaSampleMarkdown ?? throw new ArgumentNullException(nameof(ComparisonDeltaSampleMarkdown));
}
