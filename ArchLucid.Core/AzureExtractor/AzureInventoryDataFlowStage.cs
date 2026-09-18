namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     SecureNow data-flow stage labels for inventoried ARM resources (SN-DF-02 / AX-DE-16).
/// </summary>
public enum AzureInventoryDataFlowStage
{
    Source = 0,
    Ingestion = 1,
    Storage = 2,
    Transform = 3,
    Consumer = 4,
}
