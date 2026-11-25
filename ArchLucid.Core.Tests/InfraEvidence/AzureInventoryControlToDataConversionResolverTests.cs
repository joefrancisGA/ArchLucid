using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.InfraEvidence;

[Trait("Suite", "Core")]
public sealed class AzureInventoryControlToDataConversionResolverTests
{
    [Theory]
    [InlineData("Owner", "topics", "false", true)]
    [InlineData("Contributor", "domains", "false", true)]
    [InlineData("EventGrid Contributor", "topics", "false", true)]
    [InlineData("EventGrid Contributor", "topics", "true", false)]
    [InlineData("Contributor", "topics", null, false)]
    [InlineData("Owner", "topics", "unknown", false)]
    [InlineData("EventGrid EventSubscription Contributor", "topics", "false", false)]
    [InlineData("Owner", "systemTopics", "false", false)]
    public void Event_grid_key_conversion_requires_explicit_local_auth(
        string role, string segment, string? disableLocalAuth, bool expected)
    {
        Dictionary<string, string> properties = [];
        if (disableLocalAuth is not null)
            properties["disableLocalAuth"] = disableLocalAuth;
        var result = AzureInventoryControlToDataConversionResolver.ResolveForResource(
            role, $"Microsoft.EventGrid/{segment}", properties);
        result.HasPermission.Should().Be(expected);
        if (expected)
        {
            result.Permission.Should().Be(AzureInventoryDerivedDataPlanePermission.Write);
            result.InferenceQualifier.Should().Be("event-grid-list-keys-local-auth-enabled");
        }
    }

    [Fact]
    public void Event_grid_contributor_does_not_convert_storage_permissions()
    {
        AzureInventoryControlToDataConversionResolver.ResolveForResource(
            "EventGrid Contributor", "Microsoft.Storage/storageAccounts", null)
            .HasPermission.Should().BeFalse();
    }

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
