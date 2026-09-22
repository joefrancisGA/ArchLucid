using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Catalog metadata for one <c>network-associations.json</c> <c>associationType</c> (IE-RF-01).
/// </summary>
public sealed class AzureInventoryRelationshipAssociationTypeDefinition
{
    public required string AssociationType { get; init; }

    public required AzureInventoryRelationshipArmKind FromArmKind { get; init; }

    public required AzureInventoryRelationshipArmKind ToArmKind { get; init; }

    public required ProvenanceKind DefaultProvenanceKind { get; init; }

    /// <summary>
    ///     Target <see cref="ArchLucid.KnowledgeGraph.GraphEdgeTypes" /> constant name for materializers (IE-RF-07).
    /// </summary>
    public required string DefaultGraphEdgeType { get; init; }

    public required string DefaultInferenceSource { get; init; }
}
