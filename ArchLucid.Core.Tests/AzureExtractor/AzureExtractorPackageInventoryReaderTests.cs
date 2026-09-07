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
}
