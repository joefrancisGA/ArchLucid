using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Emits derived CAN_READ / CAN_WRITE edges for Contributor and Owner when control-to-data prerequisites hold.
/// </summary>
public static class AzureInventoryControlToDataConversionEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

    public static void MapConversions(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<JsonElement> roleAssignments,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(roleAssignments);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);

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

            string? roleName = AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromAssignment(
                assignment,
                roleDefinitionId);

            if (!AzureInventoryControlPlaneBuiltinRoles.IsContributorOrOwner(roleName))
            {
                continue;
            }

            string normalizedScope = ArmResourceIdNormalizer.Normalize(scopeValue);
            string principalNodeId = AzureInventoryPrincipalNodeId.Format(principalId);
            bool matchedResource = false;

            foreach (AzureExtractorExtendedResourceRow resource in resources)
            {
                string normalizedResourceArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);

                if (!AzureInventoryControlToDataConversionResolver.RoleAssignmentScopeAppliesToResource(
                        normalizedScope,
                        normalizedResourceArmId))
                {
                    continue;
                }

                matchedResource = true;
                AddConversionEdges(
                    relationships,
                    relationshipKeys,
                    principalNodeId,
                    normalizedResourceArmId,
                    roleName,
                    resource.ResourceType,
                    resource.Properties);
                AddCodeControlEdge(
                    relationships,
                    relationshipKeys,
                    principalNodeId,
                    normalizedResourceArmId,
                    resource.ResourceType,
                    resource.Properties);
            }

            if (!matchedResource)
            {
                AddConversionEdgesForScopeOnly(
                    relationships,
                    relationshipKeys,
                    principalNodeId,
                    normalizedScope,
                    roleName);
            }
        }
    }

    private static void AddConversionEdgesForScopeOnly(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string principalNodeId,
        string normalizedScope,
        string? roleName)
    {
        if (normalizedScope.Contains("/Microsoft.Storage/storageAccounts/", StringComparison.OrdinalIgnoreCase))
        {
            AddConversionEdges(
                relationships,
                relationshipKeys,
                principalNodeId,
                normalizedScope,
                roleName,
                "Microsoft.Storage/storageAccounts",
                properties: null);
        }

        if (normalizedScope.Contains("/Microsoft.KeyVault/vaults/", StringComparison.OrdinalIgnoreCase))
        {
            AddConversionEdges(
                relationships,
                relationshipKeys,
                principalNodeId,
                normalizedScope,
                roleName,
                "Microsoft.KeyVault/vaults",
                properties: null);
        }
    }

    private static void AddConversionEdges(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string principalNodeId,
        string targetArmId,
        string? roleName,
        string resourceType,
        IReadOnlyDictionary<string, string>? properties)
    {
        AzureInventoryControlToDataConversionResult conversion =
            AzureInventoryControlToDataConversionResolver.ResolveForResource(roleName, resourceType, properties);

        if (!conversion.HasPermission)
        {
            return;
        }

        string inferenceSource = string.IsNullOrWhiteSpace(conversion.InferenceQualifier)
            ? GraphEdgeInferenceSources.InventoryControlToDataConversion
            : GraphEdgeInferenceSources.WithQualifier(
                GraphEdgeInferenceSources.InventoryControlToDataConversion,
                conversion.InferenceQualifier!);

        if (conversion.Permission is AzureInventoryDerivedDataPlanePermission.Read
            or AzureInventoryDerivedDataPlanePermission.ReadAndWrite)
        {
            AddRelationship(
                relationships,
                relationshipKeys,
                principalNodeId,
                targetArmId,
                GraphEdgeTypes.CanRead,
                ProvenanceKind.DerivedFact,
                DerivedFactConfidence,
                inferenceSource);
        }

        if (conversion.Permission is AzureInventoryDerivedDataPlanePermission.Write
            or AzureInventoryDerivedDataPlanePermission.ReadAndWrite)
        {
            AddRelationship(
                relationships,
                relationshipKeys,
                principalNodeId,
                targetArmId,
                GraphEdgeTypes.CanWrite,
                ProvenanceKind.DerivedFact,
                DerivedFactConfidence,
                inferenceSource);
        }
    }

    private static void AddCodeControlEdge(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string principalNodeId,
        string targetArmId,
        string resourceType,
        IReadOnlyDictionary<string, string>? properties)
    {
        if (!AzureInventoryCodeDeploymentTargets.IsCodeDeploymentResourceType(resourceType))
        {
            return;
        }

        if (!AzureInventoryRuntimeIdentityReader.HasRuntimeIdentity(properties))
        {
            return;
        }

        if (!AzureInventoryCodeDeploymentTargets.TryGetCodeDeploymentInferenceQualifier(resourceType, out string qualifier))
        {
            return;
        }

        AddRelationship(
            relationships,
            relationshipKeys,
            principalNodeId,
            targetArmId,
            GraphEdgeTypes.CanControlCode,
            ProvenanceKind.DerivedFact,
            DerivedFactConfidence,
            GraphEdgeInferenceSources.WithQualifier(
                GraphEdgeInferenceSources.InventoryControlToDataConversion,
                qualifier));
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

    private static bool IsPimEligibilityUnknown(string? pimEligibilityKind) =>
        pimEligibilityKind?.Equals("unknown", StringComparison.OrdinalIgnoreCase) == true
        || pimEligibilityKind?.Equals("eligible", StringComparison.OrdinalIgnoreCase) == true;

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind == JsonValueKind.String ? value.GetString() : value.GetRawText();
    }
}
