using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Maps Entra principal ids to compute ARM ids that declare those identities (AX-DE-03).
/// </summary>
public static class AzureInventoryComputeIdentityPrincipalIndex
{
    public static Dictionary<string, List<string>> BuildPrincipalToComputeArmIds(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources)
    {
        ArgumentNullException.ThrowIfNull(resources);

        Dictionary<string, List<string>> principalToCompute = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureExtractorExtendedResourceRow resource in resources)
        {
            if (!IsComputeResourceType(resource.ResourceType))
            {
                continue;
            }

            string computeArmId = ArmResourceIdNormalizer.Normalize(resource.AzureResourceId);

            foreach (string principalId in EnumerateDeclaredPrincipalIds(resource))
            {
                if (!principalToCompute.TryGetValue(principalId, out List<string>? computeArmIds))
                {
                    computeArmIds = [];
                    principalToCompute[principalId] = computeArmIds;
                }

                computeArmIds.Add(computeArmId);
            }
        }

        return principalToCompute;
    }

    public static bool IsComputeResourceType(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return false;
        }

        return resourceType.Contains("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.Compute/virtualMachines", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.Compute/virtualMachineScaleSets", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.DataFactory/factories", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.ContainerService/managedClusters", StringComparison.OrdinalIgnoreCase)
               || resourceType.Contains("Microsoft.Databricks/workspaces", StringComparison.OrdinalIgnoreCase);
    }

    public static IReadOnlyList<string> ReadPrincipalIds(string? identityJson)
    {
        if (string.IsNullOrWhiteSpace(identityJson)
            || !TryParseIdentityPrincipalIds(identityJson, out List<string> principalIds))
        {
            return [];
        }

        return principalIds;
    }

    private static IEnumerable<string> EnumerateDeclaredPrincipalIds(AzureExtractorExtendedResourceRow resource)
    {
        if (resource.Properties.TryGetValue("identity", out string? identityJson))
        {
            foreach (string principalId in ReadPrincipalIds(identityJson))
            {
                yield return principalId;
            }
        }
    }

    private static bool TryParseIdentityPrincipalIds(string identityJson, out List<string> principalIds)
    {
        principalIds = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(identityJson);
            JsonElement root = document.RootElement;

            string? systemAssignedPrincipalId = TryReadString(root, "principalId");

            if (!string.IsNullOrWhiteSpace(systemAssignedPrincipalId))
            {
                principalIds.Add(systemAssignedPrincipalId.Trim());
            }

            if (root.TryGetProperty("userAssignedIdentities", out JsonElement assigned)
                && assigned.ValueKind is JsonValueKind.Object)
            {
                foreach (JsonProperty property in assigned.EnumerateObject())
                {
                    if (property.Value.ValueKind is not JsonValueKind.Object)
                    {
                        continue;
                    }

                    string? userAssignedPrincipalId = TryReadString(property.Value, "principalId");

                    if (!string.IsNullOrWhiteSpace(userAssignedPrincipalId))
                    {
                        principalIds.Add(userAssignedPrincipalId.Trim());
                    }
                }
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return principalIds.Count > 0;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : null;
    }
}
