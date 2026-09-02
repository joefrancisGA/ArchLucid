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
