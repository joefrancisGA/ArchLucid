using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Maps ADF integration runtime rows to <c>adfIntegrationRuntime</c> relationships (AX-DE-07).
/// </summary>
internal static class AzureInventoryAdfIntegrationRuntimeEdgeMapper
{
    private const decimal ObservedFactConfidence = 1.0m;

    public static void MapIntegrationRuntimes(
        IReadOnlyList<AzureInventoryAdfIntegrationRuntimeRow> integrationRuntimes,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(integrationRuntimes);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.AdfIntegrationRuntime,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        foreach (AzureInventoryAdfIntegrationRuntimeRow integrationRuntime in integrationRuntimes)
        {
            if (!integrationRuntime.CollectionStatus.Equals(
                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                    StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(integrationRuntime.WarningCode))
                {
                    warnings.Add(integrationRuntime.WarningCode);
                }

                continue;
            }

            string factoryArmId = ArmResourceIdNormalizer.Normalize(integrationRuntime.FactoryResourceId);
            string integrationRuntimeArmId = ArmResourceIdNormalizer.Normalize(integrationRuntime.IntegrationRuntimeResourceId);

            AddRelationship(
                relationships,
                relationshipKeys,
                factoryArmId,
                integrationRuntimeArmId,
                definition.DefaultGraphEdgeType,
                definition.DefaultProvenanceKind,
                ObservedFactConfidence,
                definition.DefaultInferenceSource);

            if (!string.IsNullOrWhiteSpace(integrationRuntime.SubnetId))
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    integrationRuntimeArmId,
                    ArmResourceIdNormalizer.Normalize(integrationRuntime.SubnetId),
                    GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind.ObservedFact,
                    ObservedFactConfidence,
                    definition.DefaultInferenceSource);
            }
        }
    }

    private static void AddRelationship(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromAzureResourceId,
        string toAzureResourceId,
        string relationshipType,
        ProvenanceKind provenanceKind,
        decimal confidence,
        string inferenceSource)
    {
        string key = $"{fromAzureResourceId}|{relationshipType}|{toAzureResourceId}|{(int)provenanceKind}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromAzureResourceId,
            ToAzureResourceId = toAzureResourceId,
            RelationshipType = relationshipType,
            ProvenanceKind = provenanceKind,
            Confidence = confidence,
            InferenceSource = inferenceSource,
        });
    }
}
