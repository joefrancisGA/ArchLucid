namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Direction policy for Data Flow edge labels (SN-PE-01).
/// </summary>
public enum AzureInventoryDataFlowEdgeDirection
{
    Undeclared = 0,
    DeclaredRead = 1,
    DeclaredWrite = 2,
    MayRead = 3,
    MayWrite = 4,
    MayAccess = 5,
    NetworkPath = 6,
}
