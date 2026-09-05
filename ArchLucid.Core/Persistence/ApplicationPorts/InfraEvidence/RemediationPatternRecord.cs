namespace ArchLucid.Persistence.InfraEvidence;

public sealed class RemediationPatternRecord
{
    public Guid PatternId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string PatternKey
    {
        get;
        init;
    } = string.Empty;

    public string DisplayName
    {
        get;
        init;
    } = string.Empty;

    public string? Description
    {
        get;
        init;
    }

    public string? CurrentApprovedVersion
    {
        get;
        init;
    }

    public string CreatedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
