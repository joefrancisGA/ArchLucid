namespace ArchLucid.Core.AzureExtractor;

/// <summary>Recovery Services vault protected-item wiring (RSV-03).</summary>
public static class AzureInventoryRecoveryServices
{
    public const string VaultResourceType = "Microsoft.RecoveryServices/vaults";

    public const string BackupItemKind = "backup";

    public const string ReplicationItemKind = "replicate";

    /// <summary>Vault resource property storing collected protected-item rows for graph hydration.</summary>
    public const string ProtectedItemsPropertyKey = "archlucid.recoveryServices.protectedItems";

    public const string EdgeTargetRegionPropertyKey = "recoveryServices.targetRegion";

    public const string EdgeTargetResourceIdPropertyKey = "recoveryServices.targetResourceId";

    public const string BackupEdgeLabel = "backs up";

    public const string ReplicateEdgeLabel = "replicates";
}
