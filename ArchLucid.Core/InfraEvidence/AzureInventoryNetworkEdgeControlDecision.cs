namespace ArchLucid.Core.InfraEvidence;

/// <summary>Outcome of evaluating stored network-edge control rules on a snapshot (SN-APR-05).</summary>
public enum AzureInventoryNetworkEdgeControlDecision
{
    Unknown = 0,
    Allow = 1,
    Deny = 2,
}
