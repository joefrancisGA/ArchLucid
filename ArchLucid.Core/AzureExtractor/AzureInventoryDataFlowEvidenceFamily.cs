namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Evidence families for SecureNow Data Flow diagrams (SN-PE-01).
/// </summary>
public enum AzureInventoryDataFlowEvidenceFamily
{
    DeclaredMovement = 0,
    AuthorizedAccess = 1,
    StructuralNetworkPath = 2,
    InferredHostname = 3,

    /// <summary>Operator-confirmed runtime connection (SN-RT-10 / SN-RT-13).</summary>
    HumanConfirmed = 4,
}
