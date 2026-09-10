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
