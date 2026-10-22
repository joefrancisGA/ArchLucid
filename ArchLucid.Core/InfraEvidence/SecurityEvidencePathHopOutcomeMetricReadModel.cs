namespace ArchLucid.Core.InfraEvidence;

public sealed class SecurityEvidencePathHopOutcomeMetricReadModel
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

    public string FromNodeId
    {
        get;
        init;
    } = string.Empty;

    public string ToNodeId
    {
        get;
        init;
    } = string.Empty;
}
