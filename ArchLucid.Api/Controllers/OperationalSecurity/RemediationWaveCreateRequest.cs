namespace ArchLucid.Api.Controllers.OperationalSecurity;

public sealed class RemediationWaveCreateRequest
{
    public string Name
    {
        get;
        init;
    } = string.Empty;

    public int? TargetSize
    {
        get;
        init;
    }

    public IReadOnlyList<Guid>? ExplicitCloudResourceIds
    {
        get;
        init;
    }
}
