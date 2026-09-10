namespace ArchLucid.Decisioning.Analysis;

/// <summary>Observed redundancy tier from datastore SKU / replication properties (DX-25).</summary>
public enum DatastoreSkuTier
{
    SingleRegion = 1,
    ZoneRedundant = 2,
    GeoRedundant = 3,
    MultiRegion = 4,
}
