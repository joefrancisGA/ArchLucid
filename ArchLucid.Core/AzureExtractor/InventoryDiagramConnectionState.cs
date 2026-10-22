namespace ArchLucid.Core.AzureExtractor;

/// <summary>Standalone inventory diagram node connection posture (NR-05).</summary>
public enum InventoryDiagramConnectionState
{
    Connected = 0,
    Used = 1,
    Orphaned = 2,
    Unconnected = 3,
    Unknown = 4,
}
