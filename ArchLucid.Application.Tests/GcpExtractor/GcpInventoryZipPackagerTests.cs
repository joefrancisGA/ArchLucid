using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Integrations.GcpExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class GcpInventoryZipPackagerTests
{
    [Fact]
    public void BuildZip_emits_manifest_and_resources_entries()
    {
        byte[] zipBytes = GcpInventoryZipPackager.BuildZip(
            "my-gcp-project",
            "hosted-gcp-extractor/1.0.0",
            [
                new GcpInventoryResourceEntry(
                    "//compute.googleapis.com/projects/my-gcp-project/zones/us-central1-a/instances/web-1",
                    "compute.googleapis.com/Instance",
                    "us-central1-a",
                    null)
            ]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        ZipArchiveEntry? manifestEntry = archive.GetEntry("manifest.json");
        ZipArchiveEntry? resourcesEntry = archive.GetEntry("resources.json");

        manifestEntry.Should().NotBeNull();
        resourcesEntry.Should().NotBeNull();

        using Stream manifestStream = manifestEntry!.Open();
        using StreamReader reader = new(manifestStream);
        string manifestJson = reader.ReadToEnd();

        using JsonDocument document = JsonDocument.Parse(manifestJson);
        document.RootElement.GetProperty("cloudProvider").GetString().Should().Be("Gcp");
        document.RootElement.GetProperty("projectId").GetString().Should().Be("my-gcp-project");
    }
}
