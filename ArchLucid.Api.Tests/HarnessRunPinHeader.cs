namespace ArchLucid.Api.Tests;

/// <summary>Wire fields needed to recreate the run-header create-time pin commitment.</summary>
public sealed class HarnessRunPinHeader
{
    public string? PinnedPolicyPackIdsJson
    {
        get;
        init;
    }

    public string? PinnedEvidencePackagePinsJson
    {
        get;
        init;
    }

    public string? PinnedEvidencePackagePinsHashSha256
    {
        get;
        init;
    }
}
