using System.IO.Compression;
using System.Text;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorPackageInventoryReaderTests
{
    [Fact]
    public void TryReadFromZip_keeps_unknown_resource_type()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Unknown/widget1",
                "resourceType": "Microsoft.Unknown/widget",
                "name": "widget1",
                "location": "eastus",
                "isUnknownType": true,
                "properties": { "foo": "bar" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].IsUnknownType.Should().BeTrue();
    }

    [Fact]
    public void TryReadFromZip_redacts_secret_like_property_keys()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": { "connectionString": "DefaultEndpointsProtocol=https;AccountName=x" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Resources[0].Properties["connectionString"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryReadFromZip_redacts_nested_sensitive_keys_in_object_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1",
                "resourceType": "Microsoft.Web/sites",
                "name": "app1",
                "properties": {
                  "siteConfig": {
                    "connectionString": "DefaultEndpointsProtocol=https;AccountName=x"
                  }
                }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Properties["siteConfig"].Should().Contain("[REDACTED]");
        result.Resources[0].Properties["siteConfig"].Should().NotContain("AccountName=x");
    }

    [Fact]
    public void TryReadFromZip_redacts_api_key_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.CognitiveServices/accounts/cog1",
                "resourceType": "Microsoft.CognitiveServices/accounts",
                "name": "cog1",
                "properties": { "apiKey": "super-secret-key" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources[0].Properties["apiKey"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryReadFromZip_redacts_sas_token_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": { "sasToken": "sig=abc123" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources[0].Properties["sasToken"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryReadFromZip_redacts_secret_like_tag_keys()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "tags": { "connectionString": "DefaultEndpointsProtocol=https;AccountName=x" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources[0].Tags["connectionString"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryReadFromZip_redacts_sensitive_keys_inside_array_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1",
                "resourceType": "Microsoft.Web/sites",
                "name": "app1",
                "properties": {
                  "ipSecurityRestrictions": [
                    { "clientSecret": "super-secret" }
                  ]
                }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources[0].Properties["ipSecurityRestrictions"].Should().Contain("[REDACTED]");
        result.Resources[0].Properties["ipSecurityRestrictions"].Should().NotContain("super-secret");
    }

    [Fact]
    public void TryReadFromZip_redacts_client_secret_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1",
                "resourceType": "Microsoft.Web/sites",
                "name": "app1",
                "properties": { "clientSecret": "oauth-client-secret" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources[0].Properties["clientSecret"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryReadFromZip_truncates_oversized_property_values()
    {
        string oversized = new('x', 5000);
        byte[] zipBytes = BuildZip(
            $$"""
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": { "description": "{{oversized}}" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources[0].Properties["description"].Should().HaveLength(4000);
    }

    [Fact]
    public void TryReadFromZip_skips_non_object_resource_rows()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              "not-a-resource-row",
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Name.Should().Be("sa1");
    }

    [Fact]
    public void TryReadFromZip_fails_on_non_array_diagnostic_settings_json()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.DiagnosticSettings,
            "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("diagnostic-settings.json root must be a JSON array");
    }

    [Fact]
    public void TryReadFromZip_fails_on_non_array_role_assignments_json()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.RoleAssignments,
            "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("role-assignments.json root must be a JSON array");
    }

    [Fact]
    public void TryReadFromZip_fails_on_non_array_network_associations_json()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.NetworkAssociations,
            "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("network-associations.json root must be a JSON array");
    }

    [Fact]
    public void TryReadFromZip_fails_on_non_array_policy_assignments_json()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.PolicyAssignments,
            "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("policy-assignments.json root must be a JSON array");
    }

    [Fact]
    public void TryReadFromZip_fails_on_non_array_defender_summary_json()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.DefenderSummary,
            "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeFalse();
        result.Error.Should().Contain("defender-summary.json root must be a JSON array");
    }

    [Fact]
    public void TryReadFromZip_resolves_resources_entry_case_insensitively()
    {
        byte[] zipBytes = BuildZipWithEntryName(
            "RESOURCES.JSON",
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Name.Should().Be("sa1");
    }

    [Fact]
    public void TryReadFromZip_returns_empty_resources_when_resources_json_missing()
    {
        using MemoryStream stream = new(BuildEmptyZip());

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_uses_id_property_when_resource_id_missing()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].AzureResourceId.Should().Be(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1");
    }

    [Fact]
    public void TryReadFromZip_prefers_resource_id_over_id_when_both_present()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-primary",
                "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-fallback",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].AzureResourceId.Should().Be(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa-primary");
    }

    [Fact]
    public void TryReadFromZip_prefers_resource_type_over_type_when_both_present()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "type": "Microsoft.Web/sites",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].ResourceType.Should().Be("Microsoft.Storage/storageAccounts");
    }

    [Fact]
    public void TryReadFromZip_uses_type_property_when_resource_type_missing()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "type": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].ResourceType.Should().Be("Microsoft.Storage/storageAccounts");
    }

    [Fact]
    public void TryReadFromZip_reads_valid_role_assignments_companion_array()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.RoleAssignments,
            """[{"principalId":"11111111-1111-1111-1111-111111111111","roleDefinitionId":"Owner"}]""");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.RoleAssignments.Should().ContainSingle();
        result.RoleAssignments[0].GetProperty("principalId").GetString()
            .Should().Be("11111111-1111-1111-1111-111111111111");
    }

    [Fact]
    public void TryReadFromZip_reads_string_sku_property()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "sku": "Standard_LRS"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].SkuName.Should().Be("Standard_LRS");
    }

    [Fact]
    public void TryReadFromZip_serializes_null_property_values_as_empty_string()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": { "notes": null }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Properties["notes"].Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_returns_empty_companion_arrays_when_optional_files_missing()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.RoleAssignments.Should().BeEmpty();
        result.DiagnosticSettings.Should().BeEmpty();
        result.NetworkAssociations.Should().BeEmpty();
        result.PolicyAssignments.Should().BeEmpty();
        result.DefenderSummary.Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_serializes_non_sensitive_object_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1",
                "resourceType": "Microsoft.Web/sites",
                "name": "app1",
                "properties": {
                  "siteConfig": { "alwaysOn": true, "http20Enabled": false }
                }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Properties["siteConfig"].Should().Contain("alwaysOn");
        result.Resources[0].Properties["siteConfig"].Should().NotContain("[REDACTED]");
    }

    [Fact]
    public void TryReadFromZip_throws_when_stream_is_null()
    {
        Action act = () => AzureExtractorPackageInventoryReader.TryReadFromZip(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void TryReadFromZip_returns_empty_resources_for_empty_array()
    {
        byte[] zipBytes = BuildZip("[]");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_coerces_numeric_resource_type_to_string()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": 123,
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].ResourceType.Should().Be("123");
    }

    [Fact]
    public void TryReadFromZip_coerces_numeric_resource_id_to_string()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": 12345,
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].AzureResourceId.Should().Be("12345");
    }

    [Fact]
    public void TryReadFromZip_treats_explicit_false_is_unknown_type_as_false()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "isUnknownType": false
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].IsUnknownType.Should().BeFalse();
    }

    [Fact]
    public void TryReadFromZip_treats_string_true_is_unknown_type_as_false()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Unknown/widget1",
                "resourceType": "Microsoft.Unknown/widget",
                "name": "widget1",
                "isUnknownType": "true"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].IsUnknownType.Should().BeFalse();
    }

    [Fact]
    public void TryReadFromZip_fails_on_malformed_resources_json()
    {
        byte[] zipBytes = BuildZip("{ not-valid-json");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeFalse();
        result.Error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryReadFromZip_fails_on_invalid_zip_payload()
    {
        byte[] invalidZipBytes = [0x50, 0x4B, 0x03, 0x04, 0xFF, 0xFF];

        using MemoryStream stream = new(invalidZipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeFalse();
        result.Error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryReadFromZip_serializes_false_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": { "supportsHttpsTrafficOnly": false }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Properties["supportsHttpsTrafficOnly"].Should().Be("false");
    }

    [Fact]
    public void TryReadFromZip_serializes_non_sensitive_array_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1",
                "resourceType": "Microsoft.Web/sites",
                "name": "app1",
                "properties": {
                  "allowedHosts": ["api.contoso.com", "app.contoso.com"]
                }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Properties["allowedHosts"].Should().Contain("api.contoso.com");
        result.Resources[0].Properties["allowedHosts"].Should().NotContain("[REDACTED]");
    }

    [Fact]
    public void TryReadFromZip_derives_name_from_arm_id_when_name_missing()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Name.Should().Be("sa1");
    }

    [Fact]
    public void TryReadFromZip_reads_location_on_resource_row()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "location": "westeurope"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Location.Should().Be("westeurope");
    }

    [Fact]
    public void TryReadFromZip_redacts_sensitive_boolean_and_number_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": {
                  "primaryKey": true,
                  "apiKey": 12345
                }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Properties["primaryKey"].Should().Be("[REDACTED]");
        result.Resources[0].Properties["apiKey"].Should().Be("[REDACTED]");
    }

    [Fact]
    public void TryReadFromZip_returns_empty_tags_and_properties_when_absent()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Tags.Should().BeEmpty();
        result.Resources[0].Properties.Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_skips_rows_missing_resource_type()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_defaults_is_unknown_type_to_false()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].IsUnknownType.Should().BeFalse();
    }

    [Fact]
    public void TryReadFromZip_trims_whitespace_from_arm_ids_and_resource_types()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "  /subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1  ",
                "resourceType": "  Microsoft.Storage/storageAccounts  ",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].AzureResourceId.Should().Be(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1");
        result.Resources[0].ResourceType.Should().Be("Microsoft.Storage/storageAccounts");
    }

    [Fact]
    public void TryReadFromZip_reads_valid_network_associations_companion_array()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.NetworkAssociations,
            """[{"name":"assoc1","subnetId":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default"}]""");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.NetworkAssociations.Should().ContainSingle();
        result.NetworkAssociations[0].GetProperty("name").GetString().Should().Be("assoc1");
    }

    [Fact]
    public void TryReadFromZip_reads_valid_policy_assignments_companion_array()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.PolicyAssignments,
            """[{"name":"policy1","policyDefinitionId":"/providers/Microsoft.Authorization/policyDefinitions/audit-storage"}]""");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.PolicyAssignments.Should().ContainSingle();
        result.PolicyAssignments[0].GetProperty("name").GetString().Should().Be("policy1");
    }

    [Fact]
    public void TryReadFromZip_reads_valid_defender_summary_companion_array()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.DefenderSummary,
            """[{"resourceId":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1","secureScore":85}]""");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.DefenderSummary.Should().ContainSingle();
        result.DefenderSummary[0].GetProperty("secureScore").GetInt32().Should().Be(85);
    }

    [Fact]
    public void TryReadFromZip_uses_name_as_resource_id_when_arm_id_missing()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].AzureResourceId.Should().Be("sa1");
    }

    [Fact]
    public void TryReadFromZip_skips_non_string_tag_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "tags": {
                  "env": "prod",
                  "retentionDays": 30
                }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Tags.Should().ContainKey("env");
        result.Resources[0].Tags.Should().NotContainKey("retentionDays");
    }

    [Fact]
    public void TryReadFromZip_serializes_boolean_and_number_property_values()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": {
                  "supportsHttpsTrafficOnly": true,
                  "accessTier": 1
                }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Properties["supportsHttpsTrafficOnly"].Should().Be("true");
        result.Resources[0].Properties["accessTier"].Should().Be("1");
    }

    [Fact]
    public void TryReadFromZip_reads_object_sku_name_property()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "sku": { "name": "Standard_GRS" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].SkuName.Should().Be("Standard_GRS");
    }

    [Fact]
    public void TryReadFromZip_prefers_explicit_resource_group_on_row()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg-east/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "resourceGroup": "rg-west"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].ResourceGroup.Should().Be("rg-west");
    }

    [Fact]
    public void TryReadFromZip_reads_valid_diagnostic_settings_companion_array()
    {
        byte[] zipBytes = BuildZipWithCompanion(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """,
            AzureExtractorPackageZipEntryNames.DiagnosticSettings,
            """[{"name":"diag1","workspaceId":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1"}]""");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.DiagnosticSettings.Should().ContainSingle();
        result.DiagnosticSettings[0].GetProperty("name").GetString().Should().Be("diag1");
    }

    [Fact]
    public void TryReadFromZip_extracts_resource_group_from_arm_id_when_not_on_row()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg-east/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].ResourceGroup.Should().Be("rg-east");
    }

    [Fact]
    public void TryReadFromZip_extracts_resource_group_from_mixed_case_arm_path()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/RESOURCEGROUPS/rg-east/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].ResourceGroup.Should().Be("rg-east");
    }

    [Fact]
    public void TryReadFromZip_trims_whitespace_from_name_on_resource_row()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "  sa1  "
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageInventoryReadResult result =
            AzureExtractorPackageInventoryReader.TryReadFromZip(stream);

        result.Succeeded.Should().BeTrue();
        result.Resources.Should().ContainSingle();
        result.Resources[0].Name.Should().Be("sa1");
    }

    private static byte[] BuildZip(string resourcesJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive archive = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry entry = archive.CreateEntry(AzureExtractorPackageZipEntryNames.Resources);
            using StreamWriter writer = new(entry.Open(), Encoding.UTF8);
            writer.Write(resourcesJson);
        }

        return ms.ToArray();
    }

    private static byte[] BuildZipWithCompanion(string resourcesJson, string companionEntryName, string companionJson)
    {
        byte[] baseZip = BuildZip(resourcesJson);

        using MemoryStream ms = new(baseZip);
        using MemoryStream output = new();

        using (ZipArchive readArchive = new(ms, ZipArchiveMode.Read, leaveOpen: true))
        using (ZipArchive writeArchive = new(output, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (ZipArchiveEntry entry in readArchive.Entries)
            {
                ZipArchiveEntry copied = writeArchive.CreateEntry(entry.FullName);
                using Stream source = entry.Open();
                using Stream destination = copied.Open();
                source.CopyTo(destination);
            }

            ZipArchiveEntry companion = writeArchive.CreateEntry(companionEntryName);
            using StreamWriter writer = new(companion.Open(), Encoding.UTF8);
            writer.Write(companionJson);
        }

        return output.ToArray();
    }

    private static byte[] BuildZipWithEntryName(string entryName, string resourcesJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive archive = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry entry = archive.CreateEntry(entryName);
            using StreamWriter writer = new(entry.Open(), Encoding.UTF8);
            writer.Write(resourcesJson);
        }

        return ms.ToArray();
    }

    private static byte[] BuildEmptyZip()
    {
        using MemoryStream ms = new();

        using (ZipArchive archive = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
        }

        return ms.ToArray();
    }
}
