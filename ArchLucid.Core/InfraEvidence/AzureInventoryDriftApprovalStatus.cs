namespace ArchLucid.Core.InfraEvidence;

/// <summary>Drift approval lifecycle for inventory semantic diffs.</summary>
public enum AzureInventoryDriftApprovalStatus
{
    Active = 0,
    Expired = 1,
    Revoked = 2,
}
