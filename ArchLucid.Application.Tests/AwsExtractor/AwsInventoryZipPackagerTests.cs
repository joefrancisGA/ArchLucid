using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsInventoryZipPackagerTests
{
    [Fact]
    public void BuildZip_emits_manifest_and_resources_entries()
    {
        byte[] zipBytes = AwsInventoryZipPackager.BuildZip(
            "123456789012",
            "hosted-aws-extractor/1.0.0",
            [
                new AwsInventoryResourceEntry(
                    "vpc-main",
                    "AWS::EC2::VPC",
                    "us-east-1",
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
        document.RootElement.GetProperty("cloudProvider").GetString().Should().Be("Aws");
        document.RootElement.GetProperty("accountId").GetString().Should().Be("123456789012");
    }

    [Fact]
    public void BuildZip_throws_when_account_id_missing()
    {
        Action act = () => AwsInventoryZipPackager.BuildZip("  ", "1.0.0", []);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void BuildZip_emits_readme_and_empty_resources_array()
    {
        byte[] zipBytes = AwsInventoryZipPackager.BuildZip("123456789012", "1.0.0", []);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        archive.GetEntry("README.txt").Should().NotBeNull();
        archive.GetEntry("resources.json").Should().NotBeNull();

        using Stream resourcesStream = archive.GetEntry("resources.json")!.Open();
        using StreamReader reader = new(resourcesStream);
        string resourcesJson = reader.ReadToEnd();

        using JsonDocument document = JsonDocument.Parse(resourcesJson);
        document.RootElement.ValueKind.Should().Be(JsonValueKind.Array);
        document.RootElement.GetArrayLength().Should().Be(0);
    }

    [Fact]
    public void BuildZip_trims_account_id_in_manifest()
    {
        byte[] zipBytes = AwsInventoryZipPackager.BuildZip(" 123456789012 ", "1.0.0", []);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);
        using Stream manifestStream = archive.GetEntry("manifest.json")!.Open();
        using StreamReader reader = new(manifestStream);
        string manifestJson = reader.ReadToEnd();

        using JsonDocument document = JsonDocument.Parse(manifestJson);
        document.RootElement.GetProperty("accountId").GetString().Should().Be("123456789012");
        document.RootElement.GetProperty("schemaVersion").GetInt32().Should().Be(1);
    }
}
