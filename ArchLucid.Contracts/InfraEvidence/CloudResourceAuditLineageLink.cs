namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceAuditLineageLink
{
    public bool Available
    {
        get;
        set;
    }

    public string? RelativePath
    {
        get;
        set;
    }

    public string? DegradedReason
    {
        get;
        set;
    }
}
