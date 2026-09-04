using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Deterministic heuristics classifying inventory snapshot deltas.</summary>
public static class AzureInventoryDiffHeuristics
{
    private static readonly string[] ElevatedRoleTokens =
    [
        "owner",
        "contributor",
        "user access administrator",
    ];

    public static AzureInventoryChangeType ClassifyPropertyChange(
        string propertyKey,
        string? oldValue,
        string? newValue,
        string resourceType)
    {
        ArgumentNullException.ThrowIfNull(propertyKey);

        if (IsPublicExposureProperty(propertyKey, newValue))
            return AzureInventoryChangeType.NetworkExposureChanged;

        if (propertyKey.Contains("sku", StringComparison.OrdinalIgnoreCase))
            return AzureInventoryChangeType.SkuChanged;

        if (propertyKey.Contains("location", StringComparison.OrdinalIgnoreCase)
            || propertyKey.Contains("region", StringComparison.OrdinalIgnoreCase))
            return AzureInventoryChangeType.RegionChanged;

        if (propertyKey.Contains("purge", StringComparison.OrdinalIgnoreCase)
            || propertyKey.Contains("softDelete", StringComparison.OrdinalIgnoreCase)
            || propertyKey.Contains("soft_delete", StringComparison.OrdinalIgnoreCase))
            return AzureInventoryChangeType.SecurityControlChanged;

        if (propertyKey.Contains("diagnostic", StringComparison.OrdinalIgnoreCase)
            || propertyKey.Contains("workspace", StringComparison.OrdinalIgnoreCase))
            return AzureInventoryChangeType.LoggingChanged;

        if (propertyKey.Contains("encrypt", StringComparison.OrdinalIgnoreCase))
            return AzureInventoryChangeType.EncryptionChanged;

        if (resourceType.Contains("Microsoft.Network/publicIPAddresses", StringComparison.OrdinalIgnoreCase))
            return AzureInventoryChangeType.NetworkExposureChanged;

        return AzureInventoryChangeType.ResourceModified;
    }

    public static bool IsPublicExposureProperty(string propertyKey, string? value)
    {
        if (propertyKey.Contains("enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
            && string.Equals(value, "true", StringComparison.OrdinalIgnoreCase))
            return true;

        if (propertyKey.Contains("publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(value, "Disabled", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(value))
            return true;

        return false;
    }

    public static bool IsElevatedRoleAssignment(string roleDefinitionId)
    {
        ArgumentNullException.ThrowIfNull(roleDefinitionId);

        return ElevatedRoleTokens.Any(token =>
            roleDefinitionId.Contains(token, StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsLoggingRegression(string propertyKey, string? oldValue, string? newValue)
    {
        if (!propertyKey.Contains("diagnostic", StringComparison.OrdinalIgnoreCase)
            && !propertyKey.Contains("workspace", StringComparison.OrdinalIgnoreCase))
            return false;

        return !string.IsNullOrWhiteSpace(oldValue) && string.IsNullOrWhiteSpace(newValue);
    }

    public static bool IsPrivateEndpointResource(string resourceType, string relationshipType)
    {
        if (resourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
            return true;

        return string.Equals(relationshipType, "privateEndpoint", StringComparison.OrdinalIgnoreCase);
    }

    public static string? BuildRiskClassification(AzureInventoryChangeType changeType) =>
        changeType switch
        {
            AzureInventoryChangeType.NetworkExposureChanged => "elevated",
            AzureInventoryChangeType.PermissionChanged => "elevated",
            AzureInventoryChangeType.SecurityControlChanged => "elevated",
            AzureInventoryChangeType.LoggingChanged => "medium",
            AzureInventoryChangeType.EncryptionChanged => "medium",
            _ => null,
        };

    public static string? BuildSecuritySignificance(AzureInventoryChangeType changeType) =>
        changeType switch
        {
            AzureInventoryChangeType.NetworkExposureChanged => "network-exposure",
            AzureInventoryChangeType.PermissionChanged => "rbac",
            AzureInventoryChangeType.LoggingChanged => "logging",
            AzureInventoryChangeType.SecurityControlChanged => "control",
            AzureInventoryChangeType.EncryptionChanged => "encryption",
            _ => null,
        };
}
