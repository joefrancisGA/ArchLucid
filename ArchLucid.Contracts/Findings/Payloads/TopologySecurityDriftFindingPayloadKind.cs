namespace ArchLucid.Contracts.Findings.Payloads;

/// <summary>Closed delta kind for topology-security-drift payloads (DX-64).</summary>
public enum TopologySecurityDriftFindingPayloadKind
{
    PublicInboundAdded,
    ReplicaOrFailoverRemoved,
    AdminInboundWidened,
    WriteAdminRoleAdded,
}
