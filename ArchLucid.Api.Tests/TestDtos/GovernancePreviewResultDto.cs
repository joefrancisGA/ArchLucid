namespace ArchLucid.Api.Tests.TestDtos;

public sealed class GovernancePreviewResultDto
{
    public string Environment
    {
        get;
        set;
    } = string.Empty;

    public string PreviewRunId
    {
        get;
        set;
    } = string.Empty;

    public string PreviewManifestVersion
    {
        get;
        set;
    } = string.Empty;
}
