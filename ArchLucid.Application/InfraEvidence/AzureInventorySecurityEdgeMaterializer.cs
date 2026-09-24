using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Projects live Azure inventory rows into security evidence graph edges with honest provenance (SA-02).
/// </summary>
public static class AzureInventorySecurityEdgeMaterializer
{
    private const decimal ObservedFactConfidence = 1.0m;
    private const decimal DerivedFactConfidence = 0.9m;
    private const decimal DeterministicInferenceConfidence = 0.8m;

    public static AzureInventorySecurityEdgeMaterializeResult Materialize(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<JsonElement> roleAssignments,
        IReadOnlyList<JsonElement> networkAssociations,
        IReadOnlyList<JsonElement> policyAssignments,
        IReadOnlyList<JsonElement> diagnosticSettings,
        IReadOnlyList<AzureInventoryFederatedCredentialRow> federatedCredentials,
        bool federatedCredentialsFilePresent,
        IReadOnlyList<AzureInventoryEntraGroupMembershipRow> entraGroupMemberships,
        bool entraGroupMembershipsFilePresent,
        IReadOnlyList<AzureInventoryEffectiveNetworkControlRow> effectiveNetworkControls,
        bool effectiveNetworkControlsFilePresent,
        IReadOnlyList<AzureInventoryAdfLinkedServiceRow>? adfLinkedServices = null,
        bool adfLinkedServicesFilePresent = false,
        IReadOnlyList<AzureInventoryAdfDatasetRow>? adfDatasets = null,
        bool adfDatasetsFilePresent = false,
        IReadOnlyList<AzureInventoryAdfPipelineFlowRow>? adfPipelineFlows = null,
        bool adfPipelineFlowsFilePresent = false,
        IReadOnlyList<AzureInventoryAdfTriggerRow>? adfTriggers = null,
        bool adfTriggersFilePresent = false,
        IReadOnlyList<AzureInventoryAdfIntegrationRuntimeRow>? adfIntegrationRuntimes = null,
        bool adfIntegrationRuntimesFilePresent = false,
        IReadOnlyList<AzureInventoryAdfDataflowRow>? adfDataflows = null,
        bool adfDataflowsFilePresent = false,
        IReadOnlyList<AzureInventoryEventGridSubscriptionRow>? eventGridSubscriptions = null,
        bool eventGridSubscriptionsFilePresent = false,
        IReadOnlyList<AzureInventoryLogicAppConnectionRow>? logicAppConnections = null,
        bool logicAppConnectionsFilePresent = false,
        IReadOnlyList<AzureInventoryMessagingAssociationRow>? messagingAssociations = null,
        bool messagingAssociationsFilePresent = false,
        IReadOnlyList<AzureInventoryPaasChildAssociationRow>? paasChildAssociations = null,
        bool paasChildAssociationsFilePresent = false,
        IReadOnlyList<AzureInventoryServiceConnectorLinkRow>? serviceConnectorLinks = null,
        bool serviceConnectorLinksFilePresent = false,
        IReadOnlyList<AzureInventoryAppSettingHostRow>? appSettingHosts = null,
        bool appSettingHostsFilePresent = false,
        IReadOnlyList<AzureInventoryDependencyObservationRow>? dependencyObservations = null,
        bool dependencyObservationsFilePresent = false,
        IReadOnlyList<AzureInventorySqlDatabasePrincipalRow>? sqlDatabasePrincipals = null,
        bool sqlDatabasePrincipalsFilePresent = false,
        IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow>? recoveryServicesProtectedItems = null,
        bool recoveryServicesProtectedItemsFilePresent = false)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(roleAssignments);
        ArgumentNullException.ThrowIfNull(networkAssociations);
        ArgumentNullException.ThrowIfNull(policyAssignments);
        ArgumentNullException.ThrowIfNull(diagnosticSettings);
        ArgumentNullException.ThrowIfNull(federatedCredentials);
        ArgumentNullException.ThrowIfNull(entraGroupMemberships);
        ArgumentNullException.ThrowIfNull(effectiveNetworkControls);

        IReadOnlyList<AzureInventoryAdfLinkedServiceRow> adfRows = adfLinkedServices ?? [];
        IReadOnlyList<AzureInventoryAdfDatasetRow> adfDatasetRows = adfDatasets ?? [];
        IReadOnlyList<AzureInventoryAdfPipelineFlowRow> adfFlowRows = adfPipelineFlows ?? [];
        IReadOnlyList<AzureInventoryAdfTriggerRow> adfTriggerRows = adfTriggers ?? [];
        IReadOnlyList<AzureInventoryAdfIntegrationRuntimeRow> adfIntegrationRuntimeRows = adfIntegrationRuntimes ?? [];
        IReadOnlyList<AzureInventoryAdfDataflowRow> adfDataflowRows = adfDataflows ?? [];
        IReadOnlyList<AzureInventoryEventGridSubscriptionRow> eventGridSubscriptionRows = eventGridSubscriptions ?? [];
        IReadOnlyList<AzureInventoryLogicAppConnectionRow> logicAppConnectionRows = logicAppConnections ?? [];
        IReadOnlyList<AzureInventoryMessagingAssociationRow> messagingAssociationRows = messagingAssociations ?? [];
        IReadOnlyList<AzureInventoryPaasChildAssociationRow> paasChildAssociationRows = paasChildAssociations ?? [];
        IReadOnlyList<AzureInventoryServiceConnectorLinkRow> serviceConnectorLinkRows = serviceConnectorLinks ?? [];
        IReadOnlyList<AzureInventoryAppSettingHostRow> appSettingHostRows = appSettingHosts ?? [];
        IReadOnlyList<AzureInventoryDependencyObservationRow> dependencyObservationRows = dependencyObservations ?? [];
        IReadOnlyList<AzureInventorySqlDatabasePrincipalRow> sqlDatabasePrincipalRows = sqlDatabasePrincipals ?? [];
        IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow> recoveryServicesProtectedItemRows =
            recoveryServicesProtectedItems ?? [];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        List<string> warnings = [];
        HashSet<string> relationshipKeys = new(StringComparer.OrdinalIgnoreCase);

        if (!federatedCredentialsFilePresent)
        {
            warnings.Add(SecurityEvidenceFederatedCredentialAdapterWarnings.MissingFile);
        }

        if (!entraGroupMembershipsFilePresent)
        {
            warnings.Add(SecurityEvidenceEntraGroupAdapterWarnings.MissingFile);
        }

        if (!adfLinkedServicesFilePresent)
        {
            warnings.Add(AzureInventoryAdfLinkedServiceCompletenessWarningCodes.MissingFile);
        }

        if (!adfDatasetsFilePresent)
        {
            warnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.AdfDatasetsMissing);
        }

        if (!adfPipelineFlowsFilePresent)
        {
            warnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.AdfPipelineFlowsMissing);
        }

        if (!adfTriggersFilePresent
            && resources.Any(resource =>
                resource.ResourceType.Equals(
                    AzureInventoryFactoryStyleResourceCatalog.DataFactoryResourceType,
                    StringComparison.OrdinalIgnoreCase)))
        {
            warnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.AdfTriggersMissing);
        }

        if (!adfPipelineFlowsFilePresent
            && resources.Any(resource =>
                AzureInventoryFactoryStyleResourceCatalog.IsSynapseWorkspaceResourceType(resource.ResourceType)))
        {
            warnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.SynapsePipelineFlowsMissing);
        }

        foreach (AzureExtractorExtendedResourceRow resource in resources)
        {
            string normalizedArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);
            AddObservedParentChild(resource, normalizedArmId, relationships, relationshipKeys);
            AddObservedIdentityUse(resource, normalizedArmId, relationships, relationshipKeys);
            AddObservedPublicExposure(resource, normalizedArmId, relationships, relationshipKeys);
            AddObservedPrivateEndpointConnections(resource, normalizedArmId, relationships, relationshipKeys);
            AddObservedNicSubnet(resource, normalizedArmId, relationships, relationshipKeys);
        }

        AddRoleAssignmentEdges(roleAssignments, relationships, relationshipKeys, warnings);
        AzureInventoryAppAuthorizedAccessEdgeMapper.MapAuthorizedAccess(
            resources,
            roleAssignments,
            relationships,
            relationshipKeys,
            warnings);
        AddFederatedCredentialEdges(federatedCredentials, relationships, relationshipKeys);
        AddEntraGroupMembershipEdges(entraGroupMemberships, relationships, relationshipKeys);
        foreach (JsonElement association in networkAssociations)
        {
            AzureInventoryNetworkAssociationEdgeMapper.MapAssociation(
                association,
                relationships,
                relationshipKeys,
                warnings);
        }

        AzureInventoryPrivateEndpointReachableEdgeMapper.MapPeReachableTargets(
            relationships,
            relationshipKeys,
            warnings);

        AddObservedVnetPeeringsFromResourceProperties(resources, relationships, relationshipKeys);

        AzureInventoryNetworkAssociationEdgeMapper.AddRelationshipCompletenessWarnings(
            resources,
            networkAssociations,
            relationships,
            warnings);

        AddPolicyAssignmentEdges(policyAssignments, relationships, relationshipKeys);
        AddDiagnosticEdges(diagnosticSettings, relationships, relationshipKeys, warnings);

        HashSet<string> directionalFactoryTargetPairs = new(StringComparer.OrdinalIgnoreCase);

        AzureInventoryAdfPipelineFlowEdgeMapper.MapPipelineFlows(
            resources,
            adfDatasetRows,
            adfRows,
            adfFlowRows,
            relationships,
            relationshipKeys,
            directionalFactoryTargetPairs,
            warnings);

        AzureInventoryAdfLinkedServiceEdgeMapper.MapLinkedServices(
            resources,
            adfRows,
            relationships,
            relationshipKeys,
            directionalFactoryTargetPairs,
            warnings);

        AzureInventoryAdfTriggerEdgeMapper.MapTriggers(
            adfTriggerRows,
            relationships,
            relationshipKeys,
            warnings);

        AzureInventoryAdfIntegrationRuntimeEdgeMapper.MapIntegrationRuntimes(
            adfIntegrationRuntimeRows,
            relationships,
            relationshipKeys,
            warnings);

        AzureInventoryEventGridSubscriptionEdgeMapper.MapSubscriptions(
            eventGridSubscriptionRows,
            relationships,
            relationshipKeys,
            warnings);

        AzureInventoryLogicAppConnectionEdgeMapper.MapConnections(
            logicAppConnectionRows,
            relationships,
            relationshipKeys,
            warnings);

        AzureInventoryMessagingAssociationEdgeMapper.MapAssociations(
            messagingAssociationRows,
            relationships,
            relationshipKeys,
            warnings);

        AzureInventoryPaasChildAssociationEdgeMapper.MapAssociations(
            paasChildAssociationRows,
            relationships,
            relationshipKeys,
            warnings);

        AzureInventoryServiceConnectorEdgeMapper.MapLinks(
            serviceConnectorLinkRows,
            relationships,
            relationshipKeys,
            warnings);

        if (appSettingHostsFilePresent)
        {
            AzureInventoryAppSettingHostEdgeMapper.MapHosts(
                resources,
                appSettingHostRows,
                relationships,
                relationshipKeys,
                warnings);
        }

        if (dependencyObservationsFilePresent)
        {
            AzureInventoryDependencyObservationEdgeMapper.MapObservations(
                resources,
                dependencyObservationRows,
                relationships,
                relationshipKeys,
                warnings);
        }

        if (sqlDatabasePrincipalsFilePresent)
        {
            AzureInventorySqlDatabasePrincipalEdgeMapper.MapPrincipals(
                resources,
                sqlDatabasePrincipalRows,
                relationships,
                relationshipKeys,
                warnings);
        }

        if (effectiveNetworkControlsFilePresent)
        {
            AzureInventoryEffectiveNetworkControlEdgeMapper.MapControls(
                effectiveNetworkControls,
                relationships,
                relationshipKeys);
        }

        if (!recoveryServicesProtectedItemsFilePresent
            && resources.Any(resource =>
                string.Equals(
                    resource.ResourceType,
                    AzureInventoryRecoveryServices.VaultResourceType,
                    StringComparison.OrdinalIgnoreCase)))
        {
            warnings.Add(AzureInventoryRecoveryServicesCompletenessWarningCodes.ProtectedItemsMissing);
        }

        HashSet<string> visibleArmIds = resources
            .Select(resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        AzureInventoryRecoveryServicesEdgeMapper.MapProtectedItems(
            recoveryServicesProtectedItemRows,
            visibleArmIds,
            relationships,
            relationshipKeys,
            warnings);

        return new AzureInventorySecurityEdgeMaterializeResult
        {
            Relationships = relationships,
            CompletenessWarnings = warnings,
        };
    }

    private static void AddObservedParentChild(
        AzureExtractorExtendedResourceRow resource,
        string normalizedArmId,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        string? parentArmId = TryGetParentArmId(normalizedArmId);

        if (string.IsNullOrWhiteSpace(parentArmId))
        {
            return;
        }

        AddRelationship(
            relationships,
            relationshipKeys,
            parentArmId,
            normalizedArmId,
            GraphEdgeTypes.Contains,
            ProvenanceKind.ObservedFact,
            ObservedFactConfidence,
            GraphEdgeInferenceSources.InventoryExplicitParentChild);
    }

    private static void AddObservedIdentityUse(
        AzureExtractorExtendedResourceRow resource,
        string normalizedArmId,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        foreach (string identityArmId in ExtractAssignedIdentityArmIds(resource))
        {
            AddRelationship(
                relationships,
                relationshipKeys,
                normalizedArmId,
                identityArmId,
                GraphEdgeTypes.UsesIdentity,
                ProvenanceKind.ObservedFact,
                ObservedFactConfidence,
                GraphEdgeInferenceSources.InventoryUsesIdentity);
        }
    }

    private static void AddObservedPublicExposure(
        AzureExtractorExtendedResourceRow resource,
        string normalizedArmId,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        if (!resource.ResourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!resource.Properties.TryGetValue("ipConfiguration.id", out string? ipConfigurationId)
            && !resource.Properties.TryGetValue("ipConfigurationId", out ipConfigurationId))
        {
            return;
        }

        string? associatedResourceId = TryResolveAssociatedResourceFromIpConfiguration(ipConfigurationId);

        if (string.IsNullOrWhiteSpace(associatedResourceId))
        {
            return;
        }

        AddRelationship(
            relationships,
            relationshipKeys,
            normalizedArmId,
            associatedResourceId,
            GraphEdgeTypes.Exposes,
            ProvenanceKind.ObservedFact,
            ObservedFactConfidence,
            GraphEdgeInferenceSources.InventoryPublicIp);
    }

    private static void AddObservedPrivateEndpointConnections(
        AzureExtractorExtendedResourceRow resource,
        string normalizedArmId,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        if (resource.ResourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            if (resource.Properties.TryGetValue("privateLinkServiceConnectionState.status", out _))
            {
                string? targetResourceId = TryReadLinkedResourceId(resource.Properties, "privateLinkServiceId");

                if (!string.IsNullOrWhiteSpace(targetResourceId))
                {
                    AddRelationship(
                        relationships,
                        relationshipKeys,
                        normalizedArmId,
                        targetResourceId,
                        GraphEdgeTypes.ConnectsTo,
                        ProvenanceKind.ObservedFact,
                        ObservedFactConfidence,
                        GraphEdgeInferenceSources.InventoryPrivateEndpoint);
                }
            }

            return;
        }

        if (!resource.Properties.ContainsKey("privateEndpointConnections"))
        {
            return;
        }

        string? privateEndpointId = TryReadLinkedResourceId(resource.Properties, "privateEndpoint.id");

        if (string.IsNullOrWhiteSpace(privateEndpointId))
        {
            return;
        }

        AddRelationship(
            relationships,
            relationshipKeys,
            privateEndpointId,
            normalizedArmId,
            GraphEdgeTypes.ConnectsTo,
            ProvenanceKind.ObservedFact,
            ObservedFactConfidence,
            GraphEdgeInferenceSources.InventoryPrivateEndpoint);
    }

    private static void AddObservedNicSubnet(
        AzureExtractorExtendedResourceRow resource,
        string normalizedArmId,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        if (!resource.ResourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!resource.Properties.TryGetValue("ipConfiguration.subnet.id", out string? subnetId)
            && !resource.Properties.TryGetValue("subnetId", out subnetId))
        {
            return;
        }

        AddRelationship(
            relationships,
            relationshipKeys,
            normalizedArmId,
            ArmResourceIdNormalizer.Normalize(subnetId),
            GraphEdgeTypes.ConnectsTo,
            ProvenanceKind.ObservedFact,
            ObservedFactConfidence,
            GraphEdgeInferenceSources.InventoryNicSubnet);
    }

    private static void AddObservedVnetPeeringsFromResourceProperties(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);

        foreach (AzureExtractorExtendedResourceRow resource in resources)
        {
            if (AzureInventoryVnetPeeringParser.IsPeeringResourceType(resource.ResourceType)
                || AzureInventoryVnetPeeringParser.IsPeeringResourceId(resource.AzureResourceId))
            {
                string? parentVnetId = AzureInventoryVnetPeeringParser.TryGetParentVirtualNetworkArmId(
                    resource.AzureResourceId);
                string? remoteVnetId = AzureInventoryVnetPeeringParser.TryReadRemoteVnetIdFromProperties(
                    resource.Properties.ToDictionary(
                        pair => pair.Key,
                        pair => (string?)pair.Value,
                        StringComparer.OrdinalIgnoreCase));

                if (string.IsNullOrWhiteSpace(parentVnetId) || string.IsNullOrWhiteSpace(remoteVnetId))
                {
                    continue;
                }

                AddRelationship(
                    relationships,
                    relationshipKeys,
                    ArmResourceIdNormalizer.Normalize(parentVnetId),
                    ArmResourceIdNormalizer.Normalize(remoteVnetId),
                    GraphEdgeTypes.PeersWith,
                    ProvenanceKind.ObservedFact,
                    ObservedFactConfidence,
                    GraphEdgeInferenceSources.InventoryVnetPeering);
                continue;
            }

            if (!AzureInventoryVnetPeeringParser.IsVirtualNetworkResourceType(resource.ResourceType))
            {
                continue;
            }

            if (!AzureInventoryVnetPeeringParser.TryGetPeeringsJson(
                    resource.Properties,
                    out string? peeringsJson)
                || string.IsNullOrWhiteSpace(peeringsJson))
            {
                continue;
            }

            foreach (string remoteVnetId in AzureInventoryVnetPeeringParser.EnumerateRemoteVnetIds(peeringsJson))
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    ArmResourceIdNormalizer.Normalize(resource.AzureResourceId),
                    remoteVnetId,
                    GraphEdgeTypes.PeersWith,
                    ProvenanceKind.ObservedFact,
                    ObservedFactConfidence,
                    GraphEdgeInferenceSources.InventoryVnetPeering);
            }
        }
    }

    private static void AddRoleAssignmentEdges(
        IReadOnlyList<JsonElement> roleAssignments,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        foreach (JsonElement assignment in roleAssignments)
        {
            string? scopeValue = TryReadJsonString(assignment, "scope");
            string? principalId = TryReadJsonString(assignment, "principalId");
            string? roleDefinitionId = TryReadJsonString(assignment, "roleDefinitionId");

            if (string.IsNullOrWhiteSpace(scopeValue)
                || string.IsNullOrWhiteSpace(principalId)
                || string.IsNullOrWhiteSpace(roleDefinitionId))
            {
                continue;
            }

            string normalizedScope = ArmResourceIdNormalizer.Normalize(scopeValue);
            string principalNodeId = AzureInventoryPrincipalNodeId.Format(principalId);
            string? pimEligibilityKind = TryReadJsonString(assignment, "pimEligibilityKind");
            string inferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment;
            ProvenanceKind provenanceKind = ProvenanceKind.ObservedFact;

            if (IsPimEligibilityUnknown(pimEligibilityKind))
            {
                inferenceSource = GraphEdgeInferenceSources.PimEligibilityUnknown;
                provenanceKind = ProvenanceKind.DeterministicInference;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                principalNodeId,
                normalizedScope,
                GraphEdgeTypes.HasRole,
                provenanceKind,
                provenanceKind == ProvenanceKind.ObservedFact ? ObservedFactConfidence : DeterministicInferenceConfidence,
                inferenceSource);

            string? roleName = AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromAssignment(
                assignment,
                roleDefinitionId);

            AzureInventoryDerivedDataPlanePermission permission =
                AzureInventoryRbacDataPlaneRoleMap.Resolve(roleName);

            if (permission is AzureInventoryDerivedDataPlanePermission.None)
            {
                warnings.Add($"rbac-role-unmapped:{roleDefinitionId}");

                continue;
            }

            if (IsPimEligibilityUnknown(pimEligibilityKind))
            {
                continue;
            }

            if (permission is AzureInventoryDerivedDataPlanePermission.Read
                or AzureInventoryDerivedDataPlanePermission.ReadAndWrite)
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    principalNodeId,
                    normalizedScope,
                    GraphEdgeTypes.CanRead,
                    ProvenanceKind.DerivedFact,
                    DerivedFactConfidence,
                    GraphEdgeInferenceSources.InventoryRbacDataPlaneMap);
            }

            if (permission is AzureInventoryDerivedDataPlanePermission.Write
                or AzureInventoryDerivedDataPlanePermission.ReadAndWrite)
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    principalNodeId,
                    normalizedScope,
                    GraphEdgeTypes.CanWrite,
                    ProvenanceKind.DerivedFact,
                    DerivedFactConfidence,
                    GraphEdgeInferenceSources.InventoryRbacDataPlaneMap);
            }
        }
    }

    private static void AddEntraGroupMembershipEdges(
        IReadOnlyList<AzureInventoryEntraGroupMembershipRow> memberships,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        foreach (AzureInventoryEntraGroupMembershipRow membership in memberships)
        {
            if (string.IsNullOrWhiteSpace(membership.MemberId) || string.IsNullOrWhiteSpace(membership.GroupId))
            {
                continue;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                membership.MemberNodeId,
                membership.GroupNodeId,
                GraphEdgeTypes.MemberOf,
                membership.ProvenanceKind,
                membership.ProvenanceKind == ProvenanceKind.ObservedFact
                    ? ObservedFactConfidence
                    : DerivedFactConfidence,
                GraphEdgeInferenceSources.InventoryEntraGroupMembership);
        }
    }

    private static bool IsPimEligibilityUnknown(string? pimEligibilityKind)
    {
        if (string.IsNullOrWhiteSpace(pimEligibilityKind))
        {
            return false;
        }

        return pimEligibilityKind.Equals("unknown", StringComparison.OrdinalIgnoreCase)
               || pimEligibilityKind.Equals("eligible", StringComparison.OrdinalIgnoreCase);
    }

    private static void AddFederatedCredentialEdges(
        IReadOnlyList<AzureInventoryFederatedCredentialRow> federatedCredentials,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        foreach (AzureInventoryFederatedCredentialRow credential in federatedCredentials)
        {
            if (string.IsNullOrWhiteSpace(credential.Issuer)
                || string.IsNullOrWhiteSpace(credential.Subject)
                || string.IsNullOrWhiteSpace(credential.PrincipalId))
            {
                continue;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                credential.NodeId,
                credential.PrincipalNodeId,
                GraphEdgeTypes.FederatesAs,
                credential.ProvenanceKind,
                credential.ProvenanceKind == ProvenanceKind.ObservedFact
                    ? ObservedFactConfidence
                    : DerivedFactConfidence,
                GraphEdgeInferenceSources.InventoryFederatedCredential);
        }
    }

    private static void AddPolicyAssignmentEdges(
        IReadOnlyList<JsonElement> policyAssignments,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        foreach (JsonElement assignment in policyAssignments)
        {
            string? scope = TryReadJsonString(assignment, "scope");
            string? policyDefinitionId = TryReadJsonString(assignment, "policyDefinitionId")
                                           ?? TryReadJsonString(assignment, "policySetDefinitionId");

            if (string.IsNullOrWhiteSpace(scope) || string.IsNullOrWhiteSpace(policyDefinitionId))
            {
                continue;
            }

            AddRelationship(
                relationships,
                relationshipKeys,
                ArmResourceIdNormalizer.Normalize(policyDefinitionId),
                ArmResourceIdNormalizer.Normalize(scope),
                GraphEdgeTypes.AppliesTo,
                ProvenanceKind.ObservedFact,
                ObservedFactConfidence,
                GraphEdgeInferenceSources.InventoryPolicyAssignment);
        }
    }

    private static void AddDiagnosticEdges(
        IReadOnlyList<JsonElement> diagnosticSettings,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.DiagnosticToDestination,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        foreach (JsonElement diagnostic in diagnosticSettings)
        {
            string? targetId = TryReadJsonString(diagnostic, "targetResourceId")
                               ?? TryReadJsonString(diagnostic, "resourceId");
            string? name = TryReadJsonString(diagnostic, "name");

            if (string.IsNullOrWhiteSpace(targetId))
            {
                continue;
            }

            string normalizedTargetId = ArmResourceIdNormalizer.Normalize(targetId);
            bool emittedDestination = false;

            foreach (string destinationArmId in AzureInventoryDiagnosticDestinationParser.EnumerateDestinationArmIds(diagnostic))
            {
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    normalizedTargetId,
                    destinationArmId,
                    definition.DefaultGraphEdgeType,
                    definition.DefaultProvenanceKind,
                    ObservedFactConfidence,
                    definition.DefaultInferenceSource);

                emittedDestination = true;
            }

            if (!emittedDestination && !string.IsNullOrWhiteSpace(name))
            {
                warnings.Add("diagnostic-destination-unresolved");
            }
        }
    }

    private static IEnumerable<string> ExtractAssignedIdentityArmIds(AzureExtractorExtendedResourceRow resource)
    {
        if (resource.Properties.TryGetValue("identity", out string? identityJson)
            && TryParseIdentityJson(identityJson, out List<string> parsedFromBlob))
        {
            foreach (string identityArmId in parsedFromBlob)
            {
                yield return identityArmId;
            }
        }

        foreach (KeyValuePair<string, string> property in resource.Properties)
        {
            if (!property.Key.Contains("userAssignedIdentities", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (property.Key.StartsWith("/", StringComparison.Ordinal))
            {
                yield return ArmResourceIdNormalizer.Normalize(property.Key.Split(' ', StringSplitOptions.RemoveEmptyEntries)[0]);
            }
        }
    }

    private static bool TryParseIdentityJson(string identityJson, out List<string> identityArmIds)
    {
        identityArmIds = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(identityJson);

            if (document.RootElement.TryGetProperty("userAssignedIdentities", out JsonElement assigned)
                && assigned.ValueKind is JsonValueKind.Object)
            {
                foreach (JsonProperty property in assigned.EnumerateObject())
                {
                    if (!string.IsNullOrWhiteSpace(property.Name))
                    {
                        identityArmIds.Add(ArmResourceIdNormalizer.Normalize(property.Name));
                    }
                }
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return identityArmIds.Count > 0;
    }

    private static string? TryReadLinkedResourceId(
        IReadOnlyDictionary<string, string> properties,
        string propertyKey)
    {
        if (!properties.TryGetValue(propertyKey, out string? value) || string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(value);
    }

    private static string? TryResolveAssociatedResourceFromIpConfiguration(string? ipConfigurationId)
    {
        if (string.IsNullOrWhiteSpace(ipConfigurationId))
        {
            return null;
        }

        string normalized = ArmResourceIdNormalizer.Normalize(ipConfigurationId);
        int ipConfigurationsIndex = normalized.IndexOf("/ipConfigurations/", StringComparison.OrdinalIgnoreCase);

        if (ipConfigurationsIndex <= 0)
        {
            return null;
        }

        return normalized[..ipConfigurationsIndex];
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

    private static string? TryGetParentArmId(string normalizedArmId)
    {
        if (!ArmResourceIdNormalizer.TryGetParentResourceId(normalizedArmId, out string parentResourceId))
        {
            return null;
        }

        return parentResourceId;
    }

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
