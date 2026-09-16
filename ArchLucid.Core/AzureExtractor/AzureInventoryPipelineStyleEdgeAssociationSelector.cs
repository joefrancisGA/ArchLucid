namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Chooses ADF vs Synapse association types for factory-style pipeline wiring (AX-DE-09).
/// </summary>
public static class AzureInventoryPipelineStyleEdgeAssociationSelector
{
    public static string SelectLinkedServiceAssociationType(string factoryResourceId, bool inferred)
    {
        if (AzureInventoryFactoryStyleResourceCatalog.IsSynapseWorkspaceArmId(factoryResourceId))
        {
            return inferred
                ? AzureInventoryRelationshipAssociationTypes.SynapseLinkedServiceInferred
                : AzureInventoryRelationshipAssociationTypes.SynapseLinkedService;
        }

        return inferred
            ? AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred
            : AzureInventoryRelationshipAssociationTypes.AdfLinkedService;
    }

    public static string SelectReadsFromAssociationType(string factoryResourceId)
    {
        if (AzureInventoryFactoryStyleResourceCatalog.IsSynapseWorkspaceArmId(factoryResourceId))
        {
            return AzureInventoryRelationshipAssociationTypes.SynapseReadsFrom;
        }

        return AzureInventoryRelationshipAssociationTypes.AdfReadsFrom;
    }

    public static string SelectWritesToAssociationType(string factoryResourceId)
    {
        if (AzureInventoryFactoryStyleResourceCatalog.IsSynapseWorkspaceArmId(factoryResourceId))
        {
            return AzureInventoryRelationshipAssociationTypes.SynapseWritesTo;
        }

        return AzureInventoryRelationshipAssociationTypes.AdfWritesTo;
    }
}
