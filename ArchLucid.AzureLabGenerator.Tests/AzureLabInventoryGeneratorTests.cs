using System.IO.Compression;
using System.Text.Json;

using ArchLucid.AzureLabGenerator;
using ArchLucid.Core.AzureExtractor;
using Xunit;

namespace ArchLucid.AzureLabGenerator.Tests;

[Trait("Category", "Unit")]
public sealed class AzureLabInventoryGeneratorTests
{
    [Fact]
    public void BuildsDeterministicResourceCountsAndDriftDelta()
    {
        AzureLabInventoryGenerator generator = new();
        IReadOnlyList<AzureLabResource> landingZone = generator.BuildLandingZone();
        IReadOnlyList<AzureLabResource> later = generator.BuildLandingZoneLater();
        HashSet<string> landingZoneIds = landingZone.Select(resource => resource.Id).ToHashSet(StringComparer.Ordinal);
        HashSet<string> laterIds = later.Select(resource => resource.Id).ToHashSet(StringComparer.Ordinal);

        Assert.Equal(500, landingZone.Count);
        Assert.Equal(500, later.Count);
        Assert.Equal(landingZone, generator.BuildLandingZone());
        Assert.Equal(485, landingZoneIds.Intersect(laterIds).Count());
        Assert.Equal(15, landingZoneIds.Except(laterIds).Count());
        Assert.Equal(15, laterIds.Except(landingZoneIds).Count());
    }

    [Fact]
    public void BuildsMessyEstateWithExpectedOddRows()
    {
        AzureLabInventoryGenerator generator = new();
        IReadOnlyList<AzureLabResource> resources = generator.BuildMessyEstate();

        Assert.Equal(50, resources.Count);
        Assert.Equal(2, resources.Count(resource => resource.Name == "duplicate-name"));
        Assert.Contains(resources, resource => resource.Location.Length == 0);
        Assert.Contains(resources, resource => resource.Type == "Microsoft.Contoso/widgets" && resource.IsUnknownType == true);
        Assert.Contains(resources, resource => resource.Name.Length == 180);
        Assert.Contains(resources, resource => resource.Name == "Nätverk-テスト");
        Assert.Contains(resources, resource => resource.Name == "pe-missing-target-1");
        Assert.Equal(resources.Count, resources.Select(resource => resource.Id).Distinct(StringComparer.Ordinal).Count());
    }

    [Fact]
    public void WritesReaderCompatibleDeterministicPackages()
    {
        AzureLabInventoryGenerator inventoryGenerator = new();
        AzureLabScenarioCatalog catalog = new(inventoryGenerator);
        AzureLabPackageWriter writer = new();
        AzureLabScenario scenario = catalog.Get(AzureLabScenarioId.LandingZone);

        byte[] first = writer.Build(scenario);
        byte[] second = writer.Build(scenario);

        Assert.Equal(first, second);

        using MemoryStream stream = new(first);
        AzureExtractorZipValidationResult validation = AzureExtractorPackageZipValidator.Validate(stream);

        Assert.True(validation.IsValid, validation.ErrorDetail);

        using MemoryStream resourceStream = new(first);
        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines, string? error) =
            AzureExtractorResourceInventoryReader.TryReadFromZip(resourceStream);

        Assert.Null(error);
        Assert.NotNull(lines);
        Assert.Equal(500, lines.Count);
    }

    [Fact]
    public void ParserSupportsAllAndProtectsExistingFiles()
    {
        AzureLabCommandLineParser parser = new();
        AzureLabCommandLineOptions options = parser.Parse(["--scenario", "all", "--out", "test-output"]);

        Assert.Equal(AzureLabScenarioSelection.All, options.Selection);
        Assert.False(options.Force);

        string directory = Path.Combine(Path.GetTempPath(), $"archlucid-azure-lab-{Guid.NewGuid():N}");

        try
        {
            AzureLabPackageFileWriter fileWriter = new(new AzureLabPackageWriter());
            AzureLabScenario scenario = new AzureLabScenarioCatalog(new AzureLabInventoryGenerator())
                .Get(AzureLabScenarioId.MessyEstate);
            string outputPath = Path.Combine(directory, scenario.ZipFileName);

            AzureLabPackageOutput output = fileWriter.Write(scenario, outputPath, force: false);

            Assert.True(File.Exists(output.Path));
            Assert.Equal(50, output.ResourceCount);
            Assert.Throws<AzureLabCommandLineException>(() => fileWriter.Write(scenario, outputPath, force: false));

            byte[] packageBytes = File.ReadAllBytes(output.Path);
            using ZipArchive archive = new(new MemoryStream(packageBytes), ZipArchiveMode.Read);
            Assert.Equal(5, archive.Entries.Count);
            Assert.NotNull(archive.GetEntry("resources.json"));
            using Stream resourcesStream = archive.GetEntry("resources.json")!.Open();
            using JsonDocument resourcesJson = JsonDocument.Parse(resourcesStream);
            Assert.Equal(JsonValueKind.Array, resourcesJson.RootElement.ValueKind);
        }
        finally
        {
            if (Directory.Exists(directory))
            {
                Directory.Delete(directory, recursive: true);
            }
        }
    }
}
