using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed class ToxicCombinationPathSnapshot
{
    public SecurityEvidencePathRecord Path
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<SecurityEvidencePathHopRecord> Hops
    {
        get;
        init;
    } = [];

    public HashSet<string> NodeIds
    {
        get;
        init;
    } = new(StringComparer.OrdinalIgnoreCase);

    public string TerminalNodeId
    {
        get;
        init;
    } = string.Empty;

    public Guid? TerminalCloudResourceId
    {
        get;
        init;
    }

    public string? TerminalResourceType
    {
        get;
        init;
    }
}
