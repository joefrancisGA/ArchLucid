namespace ArchLucid.Core.InfraEvidence;

public sealed class SecurityEvidencePathHopEdgeTypeReadModel
{
    public Guid PathId
    {
        get;
        init;
    }

    public string EdgeType
    {
        get;
        init;
    } = string.Empty;
}
