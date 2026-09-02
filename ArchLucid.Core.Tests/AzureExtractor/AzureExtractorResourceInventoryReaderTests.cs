using System.IO.Compression;
using System.Text;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorResourceInventoryReaderTests
{
    [Fact]
    public void TryReadFromZip_numeric_name_and_resourceType_coerce_to_strings()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": 12345,
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().NotBeNull();
        lines!.Should().ContainSingle();
        lines[0].Name.Should().Be("12345");
        lines[0].ResourceType.Should().Be("Microsoft.Storage/storageAccounts");
    }

    [Fact]
    public void TryReadFromZip_boolean_name_and_resourceType_coerce_to_strings()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": true,
                "resourceType": false,
                "location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().NotBeNull();
        lines!.Should().ContainSingle();
        lines[0].Name.Should().Be("true");
        lines[0].ResourceType.Should().Be("false");
    }

    [Fact]
    public void TryReadFromZip_string_encoded_boolean_name_and_resourceType_coerce_to_lowercase_strings()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "True",
                "resourceType": "False",
                "location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().NotBeNull();
        lines!.Should().ContainSingle();
        lines[0].Name.Should().Be("true");
        lines[0].ResourceType.Should().Be("false");
    }

    [Fact]
    public void TryReadFromZip_numeric_sku_name_coerces_to_string()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "storage1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "eastus",
                "sku": { "name": 12345 }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().NotBeNull();
        lines!.Should().ContainSingle();
        lines[0].SkuName.Should().Be("12345");
    }

    [Fact]
    public void TryReadFromZip_boolean_sku_coerces_to_string()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "storage1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "eastus",
                "sku": true
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().NotBeNull();
        lines!.Should().ContainSingle();
        lines[0].SkuName.Should().Be("true");
    }

    private static byte[] BuildZip(string resourcesJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry resources = zip.CreateEntry("resources.json");

            using StreamWriter writer = new(resources.Open(), Encoding.UTF8);

            writer.Write(resourcesJson);
        }

        return ms.ToArray();
    }
}
