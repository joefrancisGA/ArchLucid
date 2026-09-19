using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Code-owned catalog mapping association types to Data Flow evidence families (SN-PE-01).
/// </summary>
public static class AzureInventoryDataFlowEvidenceCatalog
{
    private static readonly AzureInventoryDataFlowEvidenceAssociation[] Catalog =
    [
        Row(AzureInventoryRelationshipAssociationTypes.AdfReadsFrom, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.DeclaredRead, "Reads from"),
        Row(AzureInventoryRelationshipAssociationTypes.AdfWritesTo, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.DeclaredWrite, "Writes to"),
        Row(AzureInventoryRelationshipAssociationTypes.AdfLinkedService, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.Undeclared, "Connected to"),
        Row(AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, AzureInventoryDataFlowEvidenceFamily.InferredHostname, PathConfidenceBand.Possible, AzureInventoryDataFlowEdgeDirection.Undeclared, "Likely connected to"),
        Row(AzureInventoryRelationshipAssociationTypes.SynapseReadsFrom, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.DeclaredRead, "Reads from"),
        Row(AzureInventoryRelationshipAssociationTypes.SynapseWritesTo, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.DeclaredWrite, "Writes to"),
        Row(AzureInventoryRelationshipAssociationTypes.SynapseLinkedService, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.Undeclared, "Connected to"),
        Row(AzureInventoryRelationshipAssociationTypes.SynapseLinkedServiceInferred, AzureInventoryDataFlowEvidenceFamily.InferredHostname, PathConfidenceBand.Possible, AzureInventoryDataFlowEdgeDirection.Undeclared, "Likely connected to"),
        Row(AzureInventoryRelationshipAssociationTypes.EventGridToDestination, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Confirmed, AzureInventoryDataFlowEdgeDirection.DeclaredWrite, "Routes events to"),
        Row(AzureInventoryRelationshipAssociationTypes.EventHubCapture, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Confirmed, AzureInventoryDataFlowEdgeDirection.DeclaredWrite, "Captures to"),
        Row(AzureInventoryRelationshipAssociationTypes.AdfTriggerSource, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Confirmed, AzureInventoryDataFlowEdgeDirection.Undeclared, "Triggers"),
        Row(AzureInventoryRelationshipAssociationTypes.LogicAppConnection, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.Undeclared, "Connected to"),
        Row(AzureInventoryRelationshipAssociationTypes.AppAuthorizedAccess, AzureInventoryDataFlowEvidenceFamily.AuthorizedAccess, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.MayAccess, "May access"),
        Row(AzureInventoryRelationshipAssociationTypes.SqlDatabasePrincipal, AzureInventoryDataFlowEvidenceFamily.AuthorizedAccess, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.MayAccess, "May access"),
        Row(AzureInventoryRelationshipAssociationTypes.ObservedDependency, AzureInventoryDataFlowEvidenceFamily.ObservedRuntime, PathConfidenceBand.Confirmed, AzureInventoryDataFlowEdgeDirection.Undeclared, "Observed in logs"),
        Row(AzureInventoryRelationshipAssociationTypes.AppToKeyVaultRef, AzureInventoryDataFlowEvidenceFamily.AuthorizedAccess, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.MayAccess, "May access"),
        Row(AzureInventoryRelationshipAssociationTypes.HostnameInferredTarget, AzureInventoryDataFlowEvidenceFamily.InferredHostname, PathConfidenceBand.Possible, AzureInventoryDataFlowEdgeDirection.Undeclared, "Likely connected to"),
        Row(AzureInventoryRelationshipAssociationTypes.OperatorConfirmedConnection, AzureInventoryDataFlowEvidenceFamily.HumanConfirmed, PathConfidenceBand.Confirmed, AzureInventoryDataFlowEdgeDirection.Undeclared, "Confirmed connection"),
        Row(AzureInventoryRelationshipAssociationTypes.ServiceConnectorLink, AzureInventoryDataFlowEvidenceFamily.DeclaredMovement, PathConfidenceBand.Confirmed, AzureInventoryDataFlowEdgeDirection.Undeclared, "Connected to"),
        Row(AzureInventoryRelationshipAssociationTypes.PeReachableTarget, AzureInventoryDataFlowEvidenceFamily.StructuralNetworkPath, PathConfidenceBand.Probable, AzureInventoryDataFlowEdgeDirection.NetworkPath, "Private network path"),
        Excluded(AzureInventoryRelationshipAssociationTypes.DiagnosticToDestination),
        Excluded(AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget),
        Excluded(AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet),
        Excluded(AzureInventoryRelationshipAssociationTypes.NicToSubnet),
        Excluded(AzureInventoryRelationshipAssociationTypes.VnetPeering),
        Excluded(AzureInventoryRelationshipAssociationTypes.NsgAllowRule),
        Excluded(AzureInventoryRelationshipAssociationTypes.PeDnsZoneGroup),
        Excluded(AzureInventoryRelationshipAssociationTypes.PrivateDnsVnetLink),
        Excluded(AzureInventoryRelationshipAssociationTypes.NatGatewayToSubnet),
        Excluded(AzureInventoryRelationshipAssociationTypes.FirewallToSubnet),
        Excluded(AzureInventoryRelationshipAssociationTypes.FrontDoorToOrigin),
        Excluded(AzureInventoryRelationshipAssociationTypes.IdentityToRoleAssignment),
    ];

    private static readonly Dictionary<string, AzureInventoryDataFlowEvidenceAssociation> LookupByKey =
        BuildLookup();

    public static IReadOnlyList<AzureInventoryDataFlowEvidenceAssociation> AllIncludedOnDataFlow =>
        Catalog.Where(row => row.IncludeOnDataFlow).ToList();

    public static bool TryGetDataFlowEvidence(
        string? associationTypeOrInferenceSource,
        out AzureInventoryDataFlowEvidenceAssociation? evidence)
    {
        evidence = null;

        if (string.IsNullOrWhiteSpace(associationTypeOrInferenceSource))
        {
            return false;
        }

        if (LookupByKey.TryGetValue(associationTypeOrInferenceSource.Trim(), out AzureInventoryDataFlowEvidenceAssociation? found))
        {
            evidence = found;

            return true;
        }

        return false;
    }

    public static bool IncludeOnDataFlow(string? associationType, string? inferenceSource)
    {
        if (TryGetDataFlowEvidence(associationType, out AzureInventoryDataFlowEvidenceAssociation? fromType)
            && fromType is not null
            && fromType.IncludeOnDataFlow)
        {
            return true;
        }

        if (TryGetDataFlowEvidence(inferenceSource, out AzureInventoryDataFlowEvidenceAssociation? fromInference)
            && fromInference is not null
            && fromInference.IncludeOnDataFlow)
        {
            return true;
        }

        return false;
    }

    private static AzureInventoryDataFlowEvidenceAssociation Row(
        string associationType,
        AzureInventoryDataFlowEvidenceFamily family,
        PathConfidenceBand defaultBand,
        AzureInventoryDataFlowEdgeDirection direction,
        string diagramLabel)
    {
        return new AzureInventoryDataFlowEvidenceAssociation
        {
            AssociationType = associationType,
            Family = family,
            DefaultBand = defaultBand,
            Direction = direction,
            DiagramLabel = diagramLabel,
            IncludeOnDataFlow = true,
        };
    }

    private static AzureInventoryDataFlowEvidenceAssociation Excluded(string associationType)
    {
        return new AzureInventoryDataFlowEvidenceAssociation
        {
            AssociationType = associationType,
            Family = AzureInventoryDataFlowEvidenceFamily.DeclaredMovement,
            DefaultBand = PathConfidenceBand.InsufficientEvidence,
            Direction = AzureInventoryDataFlowEdgeDirection.Undeclared,
            DiagramLabel = string.Empty,
            IncludeOnDataFlow = false,
        };
    }

    private static Dictionary<string, AzureInventoryDataFlowEvidenceAssociation> BuildLookup()
    {
        Dictionary<string, AzureInventoryDataFlowEvidenceAssociation> lookup =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryDataFlowEvidenceAssociation row in Catalog)
        {
            lookup[row.AssociationType] = row;

            if (AzureInventoryRelationshipAssociationTypes.TryGet(row.AssociationType, out AzureInventoryRelationshipAssociationTypeDefinition? definition)
                && definition is not null)
            {
                lookup[definition.DefaultInferenceSource] = row;
            }
        }

        return lookup;
    }
}
