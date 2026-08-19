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

    [Fact]
    public void BuildZip_throws_when_project_id_missing()
    {
        Action act = () => GcpInventoryZipPackager.BuildZip("", "1.0.0", []);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void BuildZip_emits_readme_and_resource_payload()
    {
        byte[] zipBytes = GcpInventoryZipPackager.BuildZip(
            "my-gcp-project",
            "1.0.0",
            [
                new GcpInventoryResourceEntry("resource-a", "type-a", "us-central1", "sku-a")
            ]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        archive.GetEntry("README.txt").Should().NotBeNull();

        using Stream resourcesStream = archive.GetEntry("resources.json")!.Open();
        using StreamReader reader = new(resourcesStream);
        string resourcesJson = reader.ReadToEnd();

        using JsonDocument document = JsonDocument.Parse(resourcesJson);
        document.RootElement.GetArrayLength().Should().Be(1);
        document.RootElement[0].GetProperty("name").GetString().Should().Be("resource-a");
        document.RootElement[0].GetProperty("sku").GetString().Should().Be("sku-a");
    }

    [Fact]
    public void BuildZip_trims_project_id_in_manifest()
    {
        byte[] zipBytes = GcpInventoryZipPackager.BuildZip(" my-gcp-project ", "1.0.0", []);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);
        using Stream manifestStream = archive.GetEntry("manifest.json")!.Open();
        using StreamReader reader = new(manifestStream);
        string manifestJson = reader.ReadToEnd();

        using JsonDocument document = JsonDocument.Parse(manifestJson);
        document.RootElement.GetProperty("projectId").GetString().Should().Be("my-gcp-project");
        document.RootElement.GetProperty("cloudProvider").GetString().Should().Be("Gcp");
    }
}
