namespace ArchLucid.Api.Tests.TestDtos;

public sealed class GovernanceEnvironmentComparisonResultDto
{
    public string SourceEnvironment
    {
        get;
        set;
    } = string.Empty;

    public string TargetEnvironment
    {
        get;
        set;
    } = string.Empty;

    public List<string> Notes
    {
        get;
        set;
    } = [];
}
