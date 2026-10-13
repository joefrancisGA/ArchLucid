namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Derives data-plane permissions from control-plane roles when a conversion's prerequisites hold on the target resource.
/// </summary>
public static class AzureInventoryControlToDataConversionResolver
{
    public static AzureInventoryControlToDataConversionResult ResolveForResource(
        string? roleName,
        string? resourceType,
        IReadOnlyDictionary<string, string>? properties)
    {
        if (!AzureInventoryControlPlaneBuiltinRoles.IsContributorOrOwner(roleName))
        {
            return AzureInventoryControlToDataConversionResult.None;
        }

        if (string.IsNullOrWhiteSpace(resourceType))
        {
            return AzureInventoryControlToDataConversionResult.None;
        }

        if (resourceType.Contains("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase))
        {
            AzureInventoryStorageSharedKeyAccessState sharedKeyState =
                AzureInventoryStorageSharedKeyAccessResolver.Resolve(properties);

            if (!AzureInventoryStorageSharedKeyAccessResolver.PermitsListKeysConversion(sharedKeyState))
            {
                return AzureInventoryControlToDataConversionResult.None;
            }

            string qualifier = sharedKeyState switch
            {
                AzureInventoryStorageSharedKeyAccessState.Enabled => "list-keys-shared-key-enabled",
                _ => "list-keys-shared-key-platform-default",
            };

            return new AzureInventoryControlToDataConversionResult
            {
                Permission = AzureInventoryDerivedDataPlanePermission.ReadAndWrite,
                InferenceQualifier = qualifier,
            };
        }

        if (resourceType.Contains("Microsoft.KeyVault/vaults", StringComparison.OrdinalIgnoreCase))
        {
            if (!AzureInventoryKeyVaultAuthorizationModelResolver.UsesAccessPolicyAuthorizationModel(properties))
            {
                return AzureInventoryControlToDataConversionResult.None;
            }

            return new AzureInventoryControlToDataConversionResult
            {
                Permission = AzureInventoryDerivedDataPlanePermission.ReadAndWrite,
                InferenceQualifier = "key-vault-access-policy-model",
            };
        }

        return AzureInventoryControlToDataConversionResult.None;
    }

    public static bool RoleAssignmentScopeAppliesToResource(string assignmentScope, string resourceArmId)
    {
        if (string.IsNullOrWhiteSpace(assignmentScope) || string.IsNullOrWhiteSpace(resourceArmId))
        {
            return false;
        }

        string normalizedScope = ArmResourceIdNormalizer.Normalize(assignmentScope);
        string normalizedResource = ArmResourceIdNormalizer.Normalize(resourceArmId);

        return string.Equals(normalizedScope, normalizedResource, StringComparison.OrdinalIgnoreCase)
            || ArmResourceIdNormalizer.IsDescendantOf(normalizedResource, normalizedScope);
    }
}

public readonly struct AzureInventoryControlToDataConversionResult
{
    public static AzureInventoryControlToDataConversionResult None =>
        new() { Permission = AzureInventoryDerivedDataPlanePermission.None, InferenceQualifier = null };

    public AzureInventoryDerivedDataPlanePermission Permission
    {
        get;
        init;
    }

    public string? InferenceQualifier
    {
        get;
        init;
    }

    public bool HasPermission =>
        Permission is not AzureInventoryDerivedDataPlanePermission.None;
}
