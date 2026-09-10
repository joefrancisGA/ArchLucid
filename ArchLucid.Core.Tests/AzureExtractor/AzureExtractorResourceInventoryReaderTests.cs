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
    public void TryReadFromZip_string_encoded_on_name_coerces_to_lowercase_string()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "on",
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
        lines[0].Name.Should().Be("true");
        lines[0].ResourceType.Should().Be("Microsoft.Storage/storageAccounts");
    }

    [Fact]
    public void TryReadFromZip_string_encoded_whole_number_double_name_coerces_to_string()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "42.0",
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
        lines[0].Name.Should().Be("42");
    }

    [Fact]
    public void TryReadFromZip_whole_number_double_name_coerces_to_string()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": 42.0,
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
        lines[0].Name.Should().Be("42");
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
    public void TryReadFromZip_returns_empty_when_resources_json_missing()
    {
        using MemoryStream stream = new(BuildEmptyZip());

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().NotBeNull();
        lines!.Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_fails_on_non_array_resources_json()
    {
        byte[] zipBytes = BuildZip("{}");

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        lines.Should().BeNull();
        error.Should().Contain("resources.json root must be a JSON array");
    }

    [Fact]
    public void TryReadFromZip_resolves_resources_entry_case_insensitively()
    {
        byte[] zipBytes = BuildZipWithEntryName(
            "RESOURCES.JSON",
            """
            [
              {
                "name": "storage1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().ContainSingle();
        lines![0].Name.Should().Be("storage1");
    }

    [Fact]
    public void TryReadFromZip_skips_non_object_resource_rows()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              "not-a-resource-row",
              {
                "name": "storage1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().ContainSingle();
        lines![0].Name.Should().Be("storage1");
    }

    [Fact]
    public void TryReadFromZip_reads_pascal_case_name_and_resource_type()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "Name": "storage1",
                "ResourceType": "Microsoft.Storage/storageAccounts",
                "Location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().ContainSingle();
        lines![0].Name.Should().Be("storage1");
        lines[0].ResourceType.Should().Be("Microsoft.Storage/storageAccounts");
        lines[0].Location.Should().Be("eastus");
    }

    [Fact]
    public void TryReadFromZip_reads_pascal_case_sku_name()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "storage1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "eastus",
                "Sku": { "Name": "Standard_GRS" }
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().ContainSingle();
        lines![0].SkuName.Should().Be("Standard_GRS");
    }

    [Fact]
    public void TryReadFromZip_skips_resource_rows_missing_resource_type()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "storage1",
                "location": "eastus"
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().NotBeNull();
        lines!.Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_throws_when_stream_is_null()
    {
        Action act = () => AzureExtractorResourceInventoryReader.TryReadFromZip(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void TryReadFromZip_treats_whitespace_only_location_as_null()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
                "name": "storage1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "location": "   "
              }
            ]
            """);

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        error.Should().BeNull();
        lines.Should().ContainSingle();
        lines![0].Location.Should().BeNull();
    }

    [Fact]
    public void TryReadFromZip_skips_resource_rows_missing_name()
    {
        byte[] zipBytes = BuildZip(
            """
            [
              {
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
        lines!.Should().BeEmpty();
    }

    [Fact]
    public void TryReadFromZip_returns_error_when_zip_payload_is_invalid()
    {
        byte[] invalidZipBytes = [0x50, 0x4B, 0x03, 0x04, 0xFF, 0xFF];

        using MemoryStream stream = new(invalidZipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        lines.Should().BeNull();
        error.Should().Be("ZIP payload is invalid while reading resources.json.");
    }

    [Fact]
    public void TryReadFromZip_returns_error_when_resources_json_is_malformed()
    {
        byte[] zipBytes = BuildZip("{ not-valid-json");

        using MemoryStream stream = new(zipBytes);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(stream);

        lines.Should().BeNull();
        error.Should().Be("resources.json JSON is malformed.");
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

    private static byte[] BuildZipWithEntryName(string entryName, string resourcesJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry resources = zip.CreateEntry(entryName);

            using StreamWriter writer = new(resources.Open(), Encoding.UTF8);

            writer.Write(resourcesJson);
        }

        return ms.ToArray();
    }

    private static byte[] BuildEmptyZip()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
        }

        return ms.ToArray();
    }
}
