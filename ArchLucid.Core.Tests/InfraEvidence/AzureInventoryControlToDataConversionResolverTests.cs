using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class AzureInventoryControlToDataConversionResolverTests
{
    [Theory]
    [InlineData("Contributor")]
    [InlineData("Owner")]
    public void ResolveForResource_storage_without_properties_assumes_platform_default_shared_key(string roleName)
    {
        AzureInventoryControlToDataConversionResult result =
            AzureInventoryControlToDataConversionResolver.ResolveForResource(
                roleName,
                "Microsoft.Storage/storageAccounts",
                properties: null);

        result.Permission.Should().Be(AzureInventoryDerivedDataPlanePermission.ReadAndWrite);
        result.InferenceQualifier.Should().Be("list-keys-shared-key-platform-default");
    }

    [Fact]
    public void ResolveForResource_storage_with_shared_key_disabled_returns_none()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryStorageSharedKeyAccessResolver.AllowSharedKeyAccessPropertyKey] = "false",
        };

        AzureInventoryControlToDataConversionResult result =
            AzureInventoryControlToDataConversionResolver.ResolveForResource(
                "Contributor",
                "Microsoft.Storage/storageAccounts",
                properties);

        result.HasPermission.Should().BeFalse();
    }

    [Fact]
    public void ResolveForResource_key_vault_rbac_authorization_enabled_returns_none()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryKeyVaultAuthorizationModelResolver.EnableRbacAuthorizationPropertyKey] = "true",
        };

        AzureInventoryControlToDataConversionResult result =
            AzureInventoryControlToDataConversionResolver.ResolveForResource(
                "Contributor",
                "Microsoft.KeyVault/vaults",
                properties);

        result.HasPermission.Should().BeFalse();
    }

    [Fact]
    public void ResolveForResource_key_vault_access_policy_model_grants_data_plane()
    {
        AzureInventoryControlToDataConversionResult result =
            AzureInventoryControlToDataConversionResolver.ResolveForResource(
                "Contributor",
                "Microsoft.KeyVault/vaults",
                properties: null);

        result.Permission.Should().Be(AzureInventoryDerivedDataPlanePermission.ReadAndWrite);
        result.InferenceQualifier.Should().Be("key-vault-access-policy-model");
    }
}
