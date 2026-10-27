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

            if (ShouldPreserveInventoryRelationshipLabel(edge.Label, edge.InferenceSource))
            {
                continue;
            }

            string resolvedLabel = ResolveDisplayLabel(edge.Label, edge.InferenceSource, edge.InferenceSource);
            edge.Label = string.IsNullOrWhiteSpace(resolvedLabel)
                ? DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel
                : resolvedLabel;
        }
    }

    private static bool ShouldPreserveInventoryRelationshipLabel(string? storedLabel, string? inferenceSource)
    {
        if (string.IsNullOrWhiteSpace(storedLabel) || string.IsNullOrWhiteSpace(inferenceSource))
        {
            return false;
        }

        string label = storedLabel.Trim();

        if (string.Equals(label, "Likely", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryNetworkConnection, StringComparison.OrdinalIgnoreCase))
        {
            return HasEvidenceCurrencyPrefix(label)
                || label.Contains('↔', StringComparison.Ordinal)
                || label.Contains("IPsec", StringComparison.OrdinalIgnoreCase);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryRouteTableRoute, StringComparison.OrdinalIgnoreCase))
        {
            return label.Contains("This is not observed traffic.", StringComparison.Ordinal)
                || label.Contains("Address prefix was not stored", StringComparison.Ordinal)
                || label.Contains("10.", StringComparison.Ordinal);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryFirewallSubnet, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(
                    label,
                    InventoryDiagramRelationshipLabelTexts.RouteNextHopConfiguredNotObservedLabel,
                    StringComparison.Ordinal)
                || label.Contains("Firewall subnet association", StringComparison.Ordinal);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryEffectiveRoutes, StringComparison.OrdinalIgnoreCase))
        {
            return label.StartsWith("Routed through ", StringComparison.OrdinalIgnoreCase);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryLbBackend, StringComparison.OrdinalIgnoreCase))
        {
            return label.StartsWith("Backend pool membership is configured", StringComparison.OrdinalIgnoreCase);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryVnetPeering, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(label, InventoryDiagramRelationshipLabelTexts.Peered, StringComparison.OrdinalIgnoreCase)
                || string.Equals(label, "peering", StringComparison.OrdinalIgnoreCase);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryNetworkConnection, StringComparison.OrdinalIgnoreCase))
        {
            return label.Length > 0;
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryRouteTableRoute, StringComparison.OrdinalIgnoreCase))
        {
            return label.Length > 0;
        }

        if (string.Equals(label, "Routes to", StringComparison.Ordinal))
        {
            return true;
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(label, InventoryDiagramRelationshipLabelTexts.PrivateAccess, StringComparison.OrdinalIgnoreCase)
                || label.StartsWith("Private endpoint connection:", StringComparison.Ordinal)
                || string.Equals(
                    label,
                    InventoryDiagramRelationshipLabelTexts.PrivateEndpointConnectionStatusNotStored,
                    StringComparison.Ordinal)
                || label.StartsWith($"{InventoryDiagramRelationshipLabelTexts.PrivateAccess} ·", StringComparison.Ordinal)
                || HasEvidenceCurrencyPrefix(label);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryObservedDependency, StringComparison.OrdinalIgnoreCase))
        {
            return label.StartsWith("Observed in logs", StringComparison.Ordinal);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryStaticSiteBackend, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(label, InventoryDiagramStaticSiteRelationshipApplier.Label, StringComparison.OrdinalIgnoreCase);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryFabricCapacityWorkspace, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(label, InventoryDiagramFabricCapacityRelationshipApplier.Label, StringComparison.OrdinalIgnoreCase);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryLogicAppConnection, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(label, DiagramRelationshipVerbCatalog.InventoryLogicAppConnectionConfiguredLabel, StringComparison.OrdinalIgnoreCase);
        }

        if (string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage, StringComparison.OrdinalIgnoreCase)
            || GraphEdgeInferenceSources.TrySplitQualifier(inferenceSource, out string diagnosticBase, out _)
                && string.Equals(
                    diagnosticBase,
                    GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage,
                    StringComparison.OrdinalIgnoreCase))
        {
            return label.Contains("Log delivery was not observed.", StringComparison.Ordinal);
        }

        return false;
    }

    private static bool HasEvidenceCurrencyPrefix(string label)
    {
        return label.StartsWith("Current", StringComparison.Ordinal)
            || label.StartsWith("Configured", StringComparison.Ordinal)
            || label.StartsWith("Observed", StringComparison.Ordinal)
            || label.StartsWith("Derived", StringComparison.Ordinal)
            || label.StartsWith("Evidence currency was not stored", StringComparison.Ordinal);
    }

    public static string ResolveDisplayLabel(string? storedLabel, string? edgeType, string? inferenceSource = null)
    {
        if (string.Equals(
                inferenceSource,
                GraphEdgeInferenceSources.HumanDeclaredConnection,
                StringComparison.OrdinalIgnoreCase))
        {
            return InventoryDiagramRelationshipLabelTexts.OperatorConfirmedConnectionLabel;
        }

        if (TryResolveAuthorizationOverlayLabel(edgeType, inferenceSource, out string authorizationOverlayLabel))
        {
            return authorizationOverlayLabel;
        }

        if (TryResolveObservedDependencyLabel(storedLabel, edgeType, inferenceSource, out string observedLabel))
        {
            return observedLabel;
        }

        if (TryResolveTopologyGraphInferenceHonestyLabel(inferenceSource, edgeType, out string topologyHonestyLabel))
        {
            return topologyHonestyLabel;
        }

        if (TryResolveQualifiedMessagingLabel(inferenceSource, out string qualifiedMessagingLabel))
        {
            return qualifiedMessagingLabel;
        }

        if (string.Equals(
                inferenceSource,
                GraphEdgeInferenceSources.InventoryLogicAppConnection,
                StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(storedLabel))
            {
                return storedLabel.Trim();
            }

            return "API connection name was not stored.";
        }

        if (TryResolveDiagnosticSettingStorageLabel(inferenceSource, out string diagnosticStorageLabel))
        {
            return diagnosticStorageLabel;
        }

        if (TryResolveCatalogDiagramLabel(edgeType, inferenceSource, out string catalogLabel))
        {
            return catalogLabel;
        }

        if (TryResolveAuthorizedAccessLabel(edgeType, inferenceSource, out string authorizedLabel))
        {
            return authorizedLabel;
        }

        if (!string.IsNullOrWhiteSpace(inferenceSource))
        {
            string trimmedInferenceSource = inferenceSource.Trim();

            if (TryHumanizeGraphEdgeType(trimmedInferenceSource, out string inferenceInventoryLabel))
            {
                return inferenceInventoryLabel;
            }

            if (InventoryAliasToGraphEdgeType.TryGetValue(trimmedInferenceSource, out string? inferenceGraphEdgeType)
                && TryHumanizeGraphEdgeType(inferenceGraphEdgeType, out string aliasedInferenceLabel))
            {
                return aliasedInferenceLabel;
            }
        }

        if (DiagramRelationshipVerbCatalog.TryResolve(inferenceSource, out string inferenceVerb))
        {
            return inferenceVerb;
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

        if (DiagramRelationshipVerbCatalog.TryResolve(edgeType, out string edgeVerb))
        {
            return edgeVerb;
        }

        if (!string.IsNullOrWhiteSpace(inferenceSource))
        {
            string fromInference = HumanizeLabel(inferenceSource);

            if (!string.IsNullOrWhiteSpace(fromInference))
            {
                return fromInference;
            }
        }

        return DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel;
    }

    private static bool TryResolveAuthorizationOverlayLabel(
        string? edgeType,
        string? inferenceSource,
        out string label)
    {
        label = string.Empty;

        if (string.Equals(edgeType, GraphEdgeTypes.MayAccess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(inferenceSource, GraphEdgeInferenceSources.InventoryAppAuthorizedAccess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(inferenceSource, AzureInventoryRelationshipAssociationTypes.AppAuthorizedAccess, StringComparison.OrdinalIgnoreCase))
        {
            label = DiagramDataFlowHonestyLegend.MayAccessOverlayEdgeLabel;

            return true;
        }

        return false;
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

        if (string.Equals(edgeType, GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase)
            || string.Equals(edgeType, GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.AppAuthorizedAccessLabel;

            return true;
        }

        return false;
    }

    private static bool TryResolveObservedDependencyLabel(
        string? storedLabel,
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

        if (IsObservedReadToken(edgeType) || IsObservedReadToken(storedLabel))
        {
            label = "Observed in logs (read)";

            return true;
        }

        if (IsObservedWriteToken(edgeType) || IsObservedWriteToken(storedLabel))
        {
            label = "Observed in logs (write)";

            return true;
        }

        label = "Observed dependency. Read/write direction was not stored.";

        return true;
    }

    private static bool TryResolveTopologyGraphInferenceHonestyLabel(
        string? inferenceSource,
        string? edgeType,
        out string label)
    {
        label = string.Empty;

        if (string.IsNullOrWhiteSpace(inferenceSource))
        {
            return false;
        }

        string source = inferenceSource.Trim();

        if (string.Equals(source, GraphEdgeInferenceSources.TopologyExposes, StringComparison.OrdinalIgnoreCase))
        {
            label = "Exposure target was stored. A public IP attachment was not stored.";

            return true;
        }

        if (string.Equals(source, GraphEdgeInferenceSources.InventoryPublicIp, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.PublicIpAttachedObservedTrafficNotStored;

            return true;
        }

        if (string.Equals(source, GraphEdgeInferenceSources.SecuritySingleTopologyFallback, StringComparison.OrdinalIgnoreCase))
        {
            label = "No protected-node list was stored. This line is not a stored protection.";

            return true;
        }

        if (string.Equals(source, GraphEdgeInferenceSources.SecurityTargeted, StringComparison.OrdinalIgnoreCase))
        {
            label = "Protected node ids were stored. Observed filtering was not stored.";

            return true;
        }

        if (string.Equals(source, GraphEdgeInferenceSources.PolicySingleTopologyFallback, StringComparison.OrdinalIgnoreCase))
        {
            label = "No applicable-node list was stored. This line is not a stored policy application.";

            return true;
        }

        if (string.Equals(source, GraphEdgeInferenceSources.PolicyTargeted, StringComparison.OrdinalIgnoreCase))
        {
            label = "Applicable node ids were stored. Observed enforcement was not stored.";

            return true;
        }

        if (string.Equals(edgeType, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase)
            && string.Equals(source, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase))
        {
            label = "No protected-node list was stored. This line is not a stored protection.";

            return true;
        }

        if (string.Equals(edgeType, GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase)
            && (string.Equals(source, GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase)
                || string.Equals(source, "applies", StringComparison.OrdinalIgnoreCase)))
        {
            label = "No applicable-node list was stored. This line is not a stored policy application.";

            return true;
        }

        return false;
    }

    private static bool IsObservedReadToken(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
            && (string.Equals(value, GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase)
                || value.Contains("CanRead", StringComparison.OrdinalIgnoreCase)
                || value.Contains("(read)", StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsObservedWriteToken(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
            && (string.Equals(value, GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase)
                || value.Contains("CanWrite", StringComparison.OrdinalIgnoreCase)
                || value.Contains("(write)", StringComparison.OrdinalIgnoreCase));
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
            label = $"{qualifier} · {InventoryDiagramRelationshipLabelTexts.CaptureConfiguredObservedCaptureNotStored}";

            return true;
        }

        if (string.Equals(baseSource, GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.FormatDiagnosticSettingStorageLabel(qualifier);

            return true;
        }

        if (string.Equals(baseSource, GraphEdgeInferenceSources.InventoryDiagnosticDestination, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.FormatDiagnosticSettingDestinationLabel(qualifier);

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

        if (DiagramRelationshipVerbCatalog.TryResolve(trimmed, out string catalogVerb))
        {
            return catalogVerb;
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
        if (string.Equals(value, "in", StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.SubnetPlacementStoredReachabilityNotObserved;

            return true;
        }

        if (string.Equals(value, AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.SubnetPlacementStoredReachabilityNotObserved;

            return true;
        }

        if (string.Equals(value, AzureInventoryRelationshipAssociationTypes.VnetPeering, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryVnetPeering, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored;

            return true;
        }

        if (string.Equals(value, AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.PrivateEndpointTargetStoredReachabilityNotObserved;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.PrivateAccess;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryLogicAppConnection, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.LogicAppConnection, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "API connection name was not stored.";

            return true;
        }

        if (string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfLinkedService, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseLinkedService, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryAdfLinkedService, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventorySynapseLinkedService, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.PipelineLinkedServiceConfiguredObservedRunNotStored;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "No stored link; hostname or linked-service text was inferred.";

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

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAgwBackend, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AgwToBackend, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryFrontDoorOrigin, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.FrontDoorToOrigin, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Routes to";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.DiagnosticSettingToStorage, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.DiagnosticSettingNameNotStoredLogDeliveryNotObserved;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryDiagnosticDestination, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.DiagnosticToDestination, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.DiagnosticSettingNameNotStoredLogDeliveryNotObserved;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryEventGridDestination, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.EventGridToDestination, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.EventSubscriptionNamesDestinationObservedDeliveryNotStored;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryServiceConnectorLink, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.ServiceConnectorLink, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.ServiceConnectorConfiguredLabel;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryIdentityRoleAssignment, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.IdentityToRoleAssignment, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Identity role assignment. This is not observed use.";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAppAuthorizedAccess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AppAuthorizedAccess, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeTypes.MayAccess, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.AppAuthorizedAccessLabel;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAppKeyVaultRef, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AppToKeyVaultRef, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Key Vault host named in app settings. This is not an access grant.";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryHostnameInferredTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.HostnameInferredTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GraphEdgeInferenceSources.InventoryStorageHostRef, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Named in app settings. This is not a declared connection.";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "No stored link; hostname or linked-service text was inferred.";

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventorySynapseReadsFrom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseReadsFrom, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredReadObservedReadNotStored;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventorySynapseWritesTo, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.SynapseWritesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredWriteObservedWriteNotStored;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfTriggerSource, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfTriggerSource, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.AdfTriggerConfiguredObservedRunNotStored;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAdfIntegrationRuntime, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AdfIntegrationRuntime, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.AdfIntegrationRuntimeConfiguredObservedRunNotStored;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryEventHubCapture, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.EventHubCapture, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.CaptureConfiguredObservedCaptureNotStored;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryPeReachableTarget, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.PeReachableTarget, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.PeReachableTargetInferredLabel;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryAvdSessionHostToVm, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.AvdSessionHostToVm, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.AvdSessionHostStoredObservedSessionNotStoredLabel;

            return true;
        }

        if (string.Equals(value, GraphEdgeInferenceSources.InventoryFirewallSubnet, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, AzureInventoryRelationshipAssociationTypes.FirewallToSubnet, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Firewall subnet association. This is not observed filtering.";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.PeersWith, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored;

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
            humanized = DiagramRelationshipVerbCatalog.InventoryDiagramLayoutContainsLabel;

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.ProtectionLinkStoredObservedProtectionNotStored;

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.AppliesToLinkStoredEnforcementNotObserved;

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.RelatesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.RelatesToStoredNotSpecificLabel;

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.DependsOn, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.DependencyStoredObservedUseNotStoredLabel;

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.Exposes, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Exposure target was stored. A public IP attachment was not stored.";

            return true;
        }

        if (DiagramRelationshipVerbCatalog.TryResolve(value, out string catalogPrivilegeVerb))
        {
            humanized = catalogPrivilegeVerb;

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Identity is assigned. Use of that identity was not stored.";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanControlCode, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Role can control code. This is not an observed deployment.";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanAddCredential, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "adds credential";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanGrantRole, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "grants role";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Role allows read. This is not observed use.";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Role allows write. This is not observed use.";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.CanAssume, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "May assume this identity. An assumption was not observed.";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.RoutesTo, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.RouteStoredObservedTrafficNotStoredLabel;

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.FederatesAs, StringComparison.OrdinalIgnoreCase))
        {
            humanized = "Federated credential is configured. This is not an observed sign-in.";

            return true;
        }

        if (string.Equals(value, GraphEdgeTypes.MemberOf, StringComparison.OrdinalIgnoreCase))
        {
            humanized = InventoryDiagramRelationshipLabelTexts.MemberOfStoredObservedUseNotStoredLabel;

            return true;
        }

        humanized = string.Empty;

        return false;
    }

    private static bool TryResolveDiagnosticSettingStorageLabel(string? inferenceSource, out string label)
    {
        label = string.Empty;

        if (string.IsNullOrWhiteSpace(inferenceSource))
        {
            return false;
        }

        if (GraphEdgeInferenceSources.TrySplitQualifier(inferenceSource, out string baseSource, out string? qualifier)
            && string.Equals(
                baseSource,
                GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage,
                StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.FormatDiagnosticSettingStorageLabel(qualifier);

            return true;
        }

        if (string.Equals(
                inferenceSource,
                GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage,
                StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.DiagnosticSettingNameNotStoredLogDeliveryNotObserved;

            return true;
        }

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
