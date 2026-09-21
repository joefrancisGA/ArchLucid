using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Catalog metadata for one Data Flow evidence association (SN-PE-01).
/// </summary>
public sealed class AzureInventoryDataFlowEvidenceAssociation
{
    public required string AssociationType { get; init; }

    public required AzureInventoryDataFlowEvidenceFamily Family { get; init; }

    public required PathConfidenceBand DefaultBand { get; init; }

    public required AzureInventoryDataFlowEdgeDirection Direction { get; init; }

    public required string DiagramLabel { get; init; }

    public required bool IncludeOnDataFlow { get; init; }
}
