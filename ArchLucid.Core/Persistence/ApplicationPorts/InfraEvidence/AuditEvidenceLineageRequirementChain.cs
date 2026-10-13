namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceLineageRequirementChain
{
    public Guid RequirementId
    {
        get;
        init;
    }

    public string RequirementName
    {
        get;
        init;
    } = string.Empty;

    public string EvidenceType
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<AuditEvidenceLineageEvidenceNode> Evidence
    {
        get;
        init;
    } = [];
}
