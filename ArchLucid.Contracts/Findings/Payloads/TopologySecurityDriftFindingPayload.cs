using ArchLucid.Contracts.Findings.Payloads;

namespace ArchLucid.Contracts.Findings.Payloads;

/// <summary>Payload for topology-security-drift findings (DX-64).</summary>
public sealed class TopologySecurityDriftFindingPayload
{
    public TopologySecurityDriftFindingPayloadKind Kind
    {
        get;
        set;
    }

    public string NodeId
    {
        get;
        set;
    } = null!;

    public Guid PriorRunId
    {
        get;
        set;
    }

    public Guid PriorGraphSnapshotId
    {
        get;
        set;
    }
}
