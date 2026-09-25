using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Composes compute → scope <c>appAuthorizedAccess</c> edges from MI principal ids and RBAC rows (AX-DE-03).
/// </summary>
internal static class AzureInventoryAppAuthorizedAccessEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

    public static void MapAuthorizedAccess(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<JsonElement> roleAssignments,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        List<string> warnings)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(roleAssignments);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);
        ArgumentNullException.ThrowIfNull(warnings);

        if (!AzureInventoryRelationshipAssociationTypes.TryGet(
                AzureInventoryRelationshipAssociationTypes.AppAuthorizedAccess,
                out AzureInventoryRelationshipAssociationTypeDefinition? definition)
            || definition is null)
        {
            return;
        }

        Dictionary<string, List<string>> principalToComputeArmIds =
            AzureInventoryComputeIdentityPrincipalIndex.BuildPrincipalToComputeArmIds(resources);
        HashSet<string> inventoriedArmIds = resources
            .Select(resource => ArmResourceIdNormalizer.Normalize(resource.AzureResourceId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

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

            string? pimEligibilityKind = TryReadJsonString(assignment, "pimEligibilityKind");

            if (IsPimEligibilityUnknown(pimEligibilityKind))
            {
                continue;
            }

            if (!principalToComputeArmIds.TryGetValue(principalId.Trim(), out List<string>? computeArmIds)
                || computeArmIds.Count == 0)
            {
                continue;
            }

            string normalizedScope = ArmResourceIdNormalizer.Normalize(scopeValue);

            if (AzureInventoryRbacAssignmentScopeClassifier.IsBroadScope(normalizedScope))
            {
                warnings.Add($"rbac-scope-too-broad:{normalizedScope}");

                continue;
            }

            if (!AzureInventoryRbacAssignmentScopeClassifier.TryResolveAttestedScope(
                    normalizedScope,
                    inventoriedArmIds,
                    out string attestedScope))
            {
                continue;
            }

            string? roleName = AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromAssignment(
                assignment,
                roleDefinitionId);

            AzureInventoryDerivedDataPlanePermission permission =
                AzureInventoryRbacDataPlaneRoleMap.Resolve(roleName);

            if (permission is AzureInventoryDerivedDataPlanePermission.None)
            {
                continue;
            }

            foreach (string computeArmId in computeArmIds.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                if (TryResolveMessagingOwnerSources(
                        roleName,
                        attestedScope,
                        resources,
                        out string writeSource,
                        out string readSource))
                {
                    AddRelationship(
                        relationships,
                        relationshipKeys,
                        computeArmId,
                        attestedScope,
                        GraphEdgeTypes.CanWrite,
                        definition.DefaultProvenanceKind,
                        DerivedFactConfidence,
                        writeSource);

                    AddRelationship(
                        relationships,
                        relationshipKeys,
                        computeArmId,
                        attestedScope,
                        GraphEdgeTypes.CanRead,
                        definition.DefaultProvenanceKind,
                        DerivedFactConfidence,
                        readSource);

                    continue;
                }

                string relationshipType = ResolveAuthorizedAccessRelationshipType(permission);

                AddRelationship(
                    relationships,
                    relationshipKeys,
                    computeArmId,
                    attestedScope,
                    relationshipType,
                    definition.DefaultProvenanceKind,
                    DerivedFactConfidence,
                    ResolveInferenceSource(roleName, attestedScope, resources, definition.DefaultInferenceSource));
            }
        }
    }

    private static string ResolveAuthorizedAccessRelationshipType(
        AzureInventoryDerivedDataPlanePermission permission)
    {
        if (permission is AzureInventoryDerivedDataPlanePermission.Read)
        {
            return GraphEdgeTypes.CanRead;
        }

        if (permission is AzureInventoryDerivedDataPlanePermission.Write)
        {
            return GraphEdgeTypes.CanWrite;
        }

        return GraphEdgeTypes.MayAccess;
    }

    private static string ResolveInferenceSource(
        string? roleName,
        string attestedScope,
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        string fallback)
    {
        AzureExtractorExtendedResourceRow? target = resources.FirstOrDefault(resource =>
            ArmResourceIdNormalizer.Normalize(resource.AzureResourceId)
                .Equals(attestedScope, StringComparison.OrdinalIgnoreCase));

        bool isEventHub = target?.ResourceType.Contains("Microsoft.EventHub/", StringComparison.OrdinalIgnoreCase) is true
                          || attestedScope.Contains("/providers/Microsoft.EventHub/", StringComparison.OrdinalIgnoreCase);
        bool isServiceBus = target?.ResourceType.Contains("Microsoft.ServiceBus/", StringComparison.OrdinalIgnoreCase) is true
                            || attestedScope.Contains("/providers/Microsoft.ServiceBus/", StringComparison.OrdinalIgnoreCase);

        if (isEventHub)
        {
            if (roleName?.Equals("Azure Event Hubs Data Sender", StringComparison.OrdinalIgnoreCase) is true)
            {
                return GraphEdgeInferenceSources.InventoryEventHubMayPublish;
            }

            if (roleName?.Equals("Azure Event Hubs Data Receiver", StringComparison.OrdinalIgnoreCase) is true)
            {
                return GraphEdgeInferenceSources.InventoryEventHubMayConsume;
            }
        }

        if (isServiceBus)
        {
            if (roleName?.Equals("Azure Service Bus Data Sender", StringComparison.OrdinalIgnoreCase) is true)
            {
                return GraphEdgeInferenceSources.InventoryServiceBusMaySend;
            }

            if (roleName?.Equals("Azure Service Bus Data Receiver", StringComparison.OrdinalIgnoreCase) is true)
            {
                return GraphEdgeInferenceSources.InventoryServiceBusMayReceive;
            }
        }

        return fallback;
    }

    private static bool TryResolveMessagingOwnerSources(
        string? roleName,
        string attestedScope,
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        out string writeSource,
        out string readSource)
    {
        writeSource = string.Empty;
        readSource = string.Empty;

        AzureExtractorExtendedResourceRow? target = resources.FirstOrDefault(resource =>
            ArmResourceIdNormalizer.Normalize(resource.AzureResourceId)
                .Equals(attestedScope, StringComparison.OrdinalIgnoreCase));

        bool isEventHub = target?.ResourceType.Contains("Microsoft.EventHub/", StringComparison.OrdinalIgnoreCase) is true
                          || attestedScope.Contains("/providers/Microsoft.EventHub/", StringComparison.OrdinalIgnoreCase);
        bool isServiceBus = target?.ResourceType.Contains("Microsoft.ServiceBus/", StringComparison.OrdinalIgnoreCase) is true
                            || attestedScope.Contains("/providers/Microsoft.ServiceBus/", StringComparison.OrdinalIgnoreCase);

        if (isEventHub && roleName?.Equals("Azure Event Hubs Data Owner", StringComparison.OrdinalIgnoreCase) is true)
        {
            writeSource = GraphEdgeInferenceSources.InventoryEventHubMayPublish;
            readSource = GraphEdgeInferenceSources.InventoryEventHubMayConsume;

            return true;
        }

        if (isServiceBus && roleName?.Equals("Azure Service Bus Data Owner", StringComparison.OrdinalIgnoreCase) is true)
        {
            writeSource = GraphEdgeInferenceSources.InventoryServiceBusMaySend;
            readSource = GraphEdgeInferenceSources.InventoryServiceBusMayReceive;

            return true;
        }

        return false;
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

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
