using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Contributor on App Service can list settings that expose SQL connection material (book Ch. 4 §4.5).
/// </summary>
public static class AzureInventoryAppSettingsCredentialConversionEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

    public static void MapConversions(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<JsonElement> roleAssignments,
        IReadOnlyList<AzureInventoryAppSettingHostRow> appSettingHosts,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(roleAssignments);
        ArgumentNullException.ThrowIfNull(appSettingHosts);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);

        if (appSettingHosts.Count == 0)
        {
            return;
        }

        Dictionary<string, List<AzureInventoryAppSettingHostRow>> rowsBySite = appSettingHosts
            .GroupBy(row => ArmResourceIdNormalizer.Normalize(row.SiteResourceId), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToList(), StringComparer.OrdinalIgnoreCase);

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

            foreach (KeyValuePair<string, List<AzureInventoryAppSettingHostRow>> siteEntry in rowsBySite)
            {
                if (!AzureInventoryControlToDataConversionResolver.RoleAssignmentScopeAppliesToResource(
                        normalizedScope,
                        siteEntry.Key))
                {
                    continue;
                }

                foreach (AzureInventoryAppSettingHostRow row in siteEntry.Value)
                {
                    if (!AzureInventoryAppSettingHostSqlTargetResolver.TryResolveSqlDatabaseArmId(
                            resources,
                            row,
                            out string databaseArmId))
                    {
                        continue;
                    }

                    AddReadEdge(
                        relationships,
                        relationshipKeys,
                        principalNodeId,
                        databaseArmId);
                }
            }
        }
    }

    private static void AddReadEdge(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string principalNodeId,
        string databaseArmId)
    {
        string inferenceSource = GraphEdgeInferenceSources.WithQualifier(
            GraphEdgeInferenceSources.InventoryControlToDataConversion,
            "app-settings-connection-string");

        string key = $"{principalNodeId}|{databaseArmId}|{GraphEdgeTypes.CanRead}|{inferenceSource}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = principalNodeId,
            ToAzureResourceId = databaseArmId,
            RelationshipType = GraphEdgeTypes.CanRead,
            ProvenanceKind = ProvenanceKind.DerivedFact,
            Confidence = DerivedFactConfidence,
            InferenceSource = inferenceSource,
        });
    }

    private static bool IsPimEligibilityUnknown(string? pimEligibilityKind)
    {
        if (string.IsNullOrWhiteSpace(pimEligibilityKind))
        {
            return false;
        }

        return pimEligibilityKind.Equals("eligible", StringComparison.OrdinalIgnoreCase)
            || pimEligibilityKind.Equals("unknown", StringComparison.OrdinalIgnoreCase);
    }

    private static string? TryReadJsonString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement property))
        {
            return null;
        }

        return property.ValueKind is JsonValueKind.String ? property.GetString() : null;
    }
}
