using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Application.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

public sealed class HostedAzureExtractorZipBuilderTests
{
    [Fact]
    public void BuildZip_contains_manifest_resources_and_policy_compliance_entries()
    {
        HostedAzureArmResourceRecord resource = new(
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
            "vm1",
            "eastus",
            null,
            null,
            new Dictionary<string, object?> { ["provisioningState"] = "Succeeded" });

        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "11111111-1111-1111-1111-111111111111",
            [resource],
            includeCostRequested: false,
            DateTimeOffset.Parse("2026-05-21T12:00:00Z"));

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        Assert.NotNull(archive.GetEntry("manifest.json"));
        Assert.NotNull(archive.GetEntry("resources.json"));
        Assert.NotNull(archive.GetEntry("policy-compliance.json"));
        Assert.NotNull(archive.GetEntry("README.txt"));

        stream.Position = 0;

        (AzureExtractorNormalizedManifest? manifest, string? error) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(stream);

        Assert.Null(error);
        Assert.NotNull(manifest);
        Assert.Equal(1, manifest!.SchemaVersion);
        Assert.Equal("11111111-1111-1111-1111-111111111111", manifest.SubscriptionId);
    }

    [Fact]
    public void BuildZip_manifest_is_schema_version_1()
    {
        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "22222222-2222-2222-2222-222222222222",
            Array.Empty<HostedAzureArmResourceRecord>(),
            includeCostRequested: true,
            DateTimeOffset.UtcNow);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        using Stream manifestStream = archive.GetEntry("manifest.json")!.Open();
        using StreamReader reader = new(manifestStream);
        string json = reader.ReadToEnd();

        using JsonDocument document = JsonDocument.Parse(json);
        Assert.Equal(1, document.RootElement.GetProperty("schemaVersion").GetInt32());
        Assert.Equal(JsonValueKind.Null, document.RootElement.GetProperty("actualCostSummary").ValueKind);
    }
}
