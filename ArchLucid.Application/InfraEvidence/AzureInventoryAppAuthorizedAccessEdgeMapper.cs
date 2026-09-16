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
                AddRelationship(
                    relationships,
                    relationshipKeys,
                    computeArmId,
                    attestedScope,
                    definition.DefaultGraphEdgeType,
                    definition.DefaultProvenanceKind,
                    DerivedFactConfidence,
                    definition.DefaultInferenceSource);
            }
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
