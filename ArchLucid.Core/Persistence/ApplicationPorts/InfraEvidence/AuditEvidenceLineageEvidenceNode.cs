namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceLineageEvidenceNode
{
    public Guid EvidenceRowId
    {
        get;
        init;
    }

    public Guid? EvaluationEvidenceItemId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public string? AzureResourceId
    {
        get;
        init;
    }

    public string? NormalizedPointer
    {
        get;
        init;
    }

    public string? RawPointer
    {
        get;
        init;
    }

    public string? ApiQueryId
    {
        get;
        init;
    }

    public DateTime CollectedUtc
    {
        get;
        init;
    }

    public string CollectorVersion
    {
        get;
        init;
    } = string.Empty;

    public string SelectorVersion
    {
        get;
        init;
    } = string.Empty;

    public bool LinkComplete
    {
        get;
        init;
    }

    public bool ItemHashVerified
    {
        get;
        init;
    }

    public IReadOnlyList<string> MissingLinkKinds
    {
        get;
        init;
    } = [];
}
