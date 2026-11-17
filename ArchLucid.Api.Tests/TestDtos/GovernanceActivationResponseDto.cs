namespace ArchLucid.Api.Tests.TestDtos;

public sealed class GovernanceActivationResponseDto
{
    public string ActivationId
    {
        get;
        set;
    } = string.Empty;

    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string ManifestVersion
    {
        get;
        set;
    } = string.Empty;

    public string Environment
    {
        get;
        set;
    } = string.Empty;

    public bool IsActive
    {
        get;
        set;
    }
}
