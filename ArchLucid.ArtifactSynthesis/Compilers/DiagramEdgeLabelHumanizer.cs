using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Maps canonical <see cref="GraphEdgeTypes" /> values to short diagram labels shown on connectors.
/// </summary>
internal static class DiagramEdgeLabelHumanizer
{
    private static readonly IReadOnlyDictionary<string, string> InventoryAliasToGraphEdgeType =
        BuildInventoryAliasToGraphEdgeType();

    public static void ApplyToVisibleEdges(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges)
        {
            if (edge.IsLayoutOnly)
            {
                continue;
            }

            edge.Label = ResolveDisplayLabel(edge.Label, edge.InferenceSource, edge.InferenceSource);
        }
    }

    public static string ResolveDisplayLabel(string? storedLabel, string? edgeType, string? inferenceSource = null)
    {
        if (TryResolveObservedDependencyLabel(edgeType, inferenceSource, out string observedLabel))
        {
            return observedLabel;
        }

        if (TryResolveQualifiedMessagingLabel(inferenceSource, out string qualifiedMessagingLabel))
        {
            return qualifiedMessagingLabel;
        }

        if (TryResolveCatalogDiagramLabel(edgeType, inferenceSource, out string catalogLabel))
        {
            return catalogLabel;
        }

        if (TryResolveAuthorizedAccessLabel(edgeType, inferenceSource, out string authorizedLabel))
        {
            return authorizedLabel;
        }

        string fromStored = HumanizeLabel(storedLabel);

        if (!string.IsNullOrWhiteSpace(fromStored))
        {
            return fromStored;
        }

        string fromType = HumanizeLabel(edgeType);

        if (!string.IsNullOrWhiteSpace(fromType))
        {
            return fromType;
        }

        return HumanizeLabel(inferenceSource);
    }

    private static bool TryResolveAuthorizedAccessLabel(
        string? edgeType,
        string? inferenceSource,
        out string label)
    {
        label = string.Empty;

        if (!string.Equals(
                inferenceSource,
                GraphEdgeInferenceSources.InventoryAppAuthorizedAccess,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.Equals(edgeType, GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
        {
            label = "May read";

            return true;
        }

        if (string.Equals(edgeType, GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            label = "May write";

            return true;
        }

        return false;
    }

    private static bool TryResolveObservedDependencyLabel(
        string? edgeType,
        string? inferenceSource,
        out string label)
    {
        label = string.Empty;

        if (!string.Equals(
                inferenceSource,
                GraphEdgeInferenceSources.InventoryObservedDependency,
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.Equals(edgeType, GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
        {
            label = "Observed in logs (read)";

            return true;
        }

        if (string.Equals(edgeType, GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            label = "Observed in logs (write)";

            return true;
        }

        label = "Observed in logs";

        return true;
    }

    private static bool TryResolveQualifiedMessagingLabel(string? inferenceSource, out string label)
    {
        label = string.Empty;

        if (!GraphEdgeInferenceSources.TrySplitQualifier(inferenceSource, out string baseSource, out string? qualifier)
            || string.IsNullOrWhiteSpace(qualifier))
        {
            return false;
        }

        if (string.Equals(baseSource, GraphEdgeInferenceSources.InventoryEventHubCapture, StringComparison.OrdinalIgnoreCase))
        {
            label = $"{qualifier} · Captures to";

            return true;
        }

        if (string.Equals(baseSource, GraphEdgeInferenceSources.InventoryDiagnosticDestination, StringComparison.OrdinalIgnoreCase))
        {
            label = $"Sends diagnostics to {qualifier}";

            return true;
        }

        return false;
    }

    private static bool TryResolveCatalogDiagramLabel(
        string? edgeType,
        string? inferenceSource,
        out string label)
    {
        label = string.Empty;

        string lookupInference = inferenceSource ?? string.Empty;

        if (GraphEdgeInferenceSources.TrySplitQualifier(inferenceSource, out string baseInference, out _))
        {
            lookupInference = baseInference;
        }

        if (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(lookupInference, out AzureInventoryDataFlowEvidenceAssociation? fromInference)
            && fromInference is not null
            && fromInference.IncludeOnDataFlow
            && !string.IsNullOrWhiteSpace(fromInference.DiagramLabel))
        {
            label = fromInference.DiagramLabel;

            return true;
        }

        if (AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(edgeType, out AzureInventoryDataFlowEvidenceAssociation? fromType)
            && fromType is not null
            && fromType.IncludeOnDataFlow
            && !string.IsNullOrWhiteSpace(fromType.DiagramLabel))
        {
            label = fromType.DiagramLabel;

            return true;
        }

        return false;
    }

    public static string HumanizeLabel(string? label)
    {
        if (string.IsNullOrWhiteSpace(label))
        {
            return string.Empty;
        }

        string trimmed = label.Trim();

        if (TryHumanizeGraphEdgeType(trimmed, out string humanized))
        {
            return humanized;
        }

        if (InventoryAliasToGraphEdgeType.TryGetValue(trimmed, out string? graphEdgeType)
            && TryHumanizeGraphEdgeType(graphEdgeType, out string aliased))
        {
            return aliased;
        }

        return trimmed;
    }

    private static bool TryHumanizeGraphEdgeType(string value, out string humanized)
    {
        if (string.Equals(value, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "in";

            return true;
        }

        if (string.Equals(value, AzureInventoryRelationshipAssociationTypes.LogicAppConnection, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryLogicAppConnection, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfLinkedService, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseLinkedService, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "uses";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfLinkedService, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfLinkedService, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "uses";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Likely connected to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfReadsFrom, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Reads from";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfWritesTo, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfWritesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Writes to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryDiagnosticDestination, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.DiagnosticToDestination, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Sends diagnostics to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryEventGridDestination, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.EventGridToDestination, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Routes events to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryServiceConnectorLink, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.ServiceConnectorLink, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Connected to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryIdentityRoleAssignment, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.IdentityToRoleAssignment, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Uses identity";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAppAuthorizedAccess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AppAuthorizedAccess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeTypes.MayAccess, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "May access";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAppKeyVaultRef, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AppToKeyVaultRef, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Uses vault";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryHostnameInferredTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.HostnameInferredTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Likely connected to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventorySynapseReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseReadsFrom, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Reads from";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventorySynapseWritesTo, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseWritesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Writes to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfTriggerSource, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfTriggerSource, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Triggers";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfIntegrationRuntime, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfIntegrationRuntime, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Runs on";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryEventHubCapture, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.EventHubCapture, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Captures to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryPeReachableTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.PeReachableTarget, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Private network path";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAvdSessionHostToVm, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AvdSessionHostToVm, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "AVD session host";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryFirewallSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.FirewallToSubnet, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "protects";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.PeersWith, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "peering";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.ConnectsTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "connects";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.Contains, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "contains";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "protects";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "applies";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.RelatesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "relates to";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.DependsOn, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "depends on";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.Exposes, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "exposes";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.HasRole, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "has role";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "uses";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "reads";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "writes";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanAssume, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "can assume";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.RoutesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "routes to";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.FederatesAs, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "federates";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.MemberOf, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "member of";

            return true;
        }

        humanized = string.Empty;

        return false;
    }

    private static Dictionary<string, string> BuildInventoryAliasToGraphEdgeType()
    {
        Dictionary<string, string> aliases = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryRelationshipAssociationTypeDefinition definition in AzureInventoryRelationshipAssociationTypes.All)
        {
            aliases[definition.AssociationType] = definition.DefaultGraphEdgeType;
            aliases[definition.DefaultInferenceSource] = definition.DefaultGraphEdgeType;
        }

        return aliases;
    }
}
