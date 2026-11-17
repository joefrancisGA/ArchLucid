namespace ArchLucid.Api.Tests.TestDtos;

public sealed class RunDto
{
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    public string RequestId
    {
        get;
        set;
    } = string.Empty;

    public string Status
    {
        get;
        set;
    } = string.Empty;

    public string? CurrentManifestVersion
    {
        get;
        set;
    }

    public string? PinnedPolicyPackIdsJson
    {
        get;
        set;
    }

    public string? PinnedEvidencePackagePinsJson
    {
        get;
        set;
    }

    public string? PinnedEvidencePackagePinsHashSha256
    {
        get;
        set;
    }
}
