namespace ArchLucid.Decisioning.Analysis;

/// <summary>Closed security-semantic delta vocabulary for topology-security-drift (DX-64).</summary>
public enum TopologySecurityDeltaKind
{
    PublicInboundAdded,
    ReplicaOrFailoverRemoved,
    AdminInboundWidened,
    WriteAdminRoleAdded,
}
