using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Packaging;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExportManifestBuilderTests
{
    [Fact]
    public void ComputeSha256UpperHex_returns_upper_hex()
    {
        byte[] content = Encoding.UTF8.GetBytes("hello");
        byte[] expected = SHA256.HashData(content);

        ExportManifestBuilder.ComputeSha256UpperHex(content).Should().Be(Convert.ToHexString(expected));
    }

    [Fact]
    public void BuildJson_sorts_files_by_ordinal_path()
    {
        List<ExportManifestFileEntry> files =
        [
            new() { Path = "z.txt", Sha256 = "AA", Bytes = 1 },
            new() { Path = "a.txt", Sha256 = "BB", Bytes = 2 }
        ];

        string json = ExportManifestBuilder.BuildJson(
            Guid.NewGuid(),
            Guid.NewGuid(),
            new DateTime(2026, 6, 6, 12, 0, 0, DateTimeKind.Utc),
            "hash",
            "rules",
            "rule-hash",
            files.OrderBy(f => f.Path, StringComparer.Ordinal).ToList());

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement.ArrayEnumerator array = doc.RootElement.GetProperty("files").EnumerateArray();
        array.MoveNext();
        array.Current.GetProperty("path").GetString().Should().Be("a.txt");
        array.MoveNext();
        array.Current.GetProperty("path").GetString().Should().Be("z.txt");
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactPackagingServiceExportManifestTests
{
    private sealed class FixedContentTypeResolver : IArtifactContentTypeResolver
    {
        public string Resolve(SynthesizedArtifact artifact)
        {
            _ = artifact;

            return "text/plain";
        }
    }

    [Fact]
    public void BuildRunExportPackage_writes_export_manifest_listing_every_other_entry()
    {
        ArtifactPackagingService sut = new(new FixedContentTypeResolver());
        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        const string manifestJson = """{"manifestId":"00000000-0000-0000-0000-000000000001"}""";
        const string traceJson = """{"trace":true}""";
        RunExportReadmeContext readme = new()
        {
            ManifestHash = "COMMITTED-HASH",
            RuleSetId = "default-rules",
            RuleSetHash = "RULE-HASH"
        };
        List<SynthesizedArtifact> artifacts =
        [
            new()
            {
                Name = "diagram.md",
                Content = "graph TD; A-->B",
                Format = "text",
                ContentHash = "h1",
                ArtifactType = "diagram"
            }
        ];

        ArtifactPackage package = sut.BuildRunExportPackage(
            runId,
            manifestId,
            artifacts,
            manifestJson,
            traceJson,
            readme);

        using MemoryStream stream = new(package.Content);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        ZipArchiveEntry? exportManifestEntry = archive.GetEntry("export-manifest.json");
        exportManifestEntry.Should().NotBeNull();

        using StreamReader reader = new(exportManifestEntry!.Open(), Encoding.UTF8);
        string exportManifestJson = reader.ReadToEnd();
        using JsonDocument doc = JsonDocument.Parse(exportManifestJson);

        doc.RootElement.GetProperty("schemaVersion").GetInt32().Should().Be(1);
        doc.RootElement.GetProperty("committedManifestHash").GetString().Should().Be("COMMITTED-HASH");
        doc.RootElement.GetProperty("ruleSetId").GetString().Should().Be("default-rules");
        doc.RootElement.GetProperty("ruleSetHash").GetString().Should().Be("RULE-HASH");

        HashSet<string> listedPaths = doc.RootElement.GetProperty("files")
            .EnumerateArray()
            .Select(e => e.GetProperty("path").GetString()!)
            .ToHashSet(StringComparer.Ordinal);

        listedPaths.Should().NotContain("export-manifest.json");
        listedPaths.Should().Contain("manifest.json");
        listedPaths.Should().Contain("decision-trace.json");
        listedPaths.Should().Contain("README.txt");
        listedPaths.Should().Contain("package-metadata.json");
        listedPaths.Should().Contain("artifacts/diagram.md");

        JsonElement manifestFile = doc.RootElement.GetProperty("files")
            .EnumerateArray()
            .Single(e => e.GetProperty("path").GetString() == "manifest.json");

        byte[] manifestBytes = Encoding.UTF8.GetBytes(manifestJson);
        manifestFile.GetProperty("sha256").GetString()
            .Should()
            .Be(ExportManifestBuilder.ComputeSha256UpperHex(manifestBytes));
        manifestFile.GetProperty("bytes").GetInt32().Should().Be(manifestBytes.Length);
    }

    [Fact]
    public void BuildRunExportPackage_export_manifest_hashes_stable_entries_identically()
    {
        ArtifactPackagingService sut = new(new FixedContentTypeResolver());
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        const string manifestJson = """{"manifestId":"00000000-0000-0000-0000-000000000001"}""";

        ArtifactPackage first = sut.BuildRunExportPackage(runId, manifestId, [], manifestJson);
        ArtifactPackage second = sut.BuildRunExportPackage(runId, manifestId, [], manifestJson);

        static string ReadManifestFileSha256(byte[] zipBytes)
        {
            using MemoryStream stream = new(zipBytes);
            using ZipArchive archive = new(stream, ZipArchiveMode.Read);
            ZipArchiveEntry? entry = archive.GetEntry("export-manifest.json");
            using StreamReader reader = new(entry!.Open(), Encoding.UTF8);
            using JsonDocument doc = JsonDocument.Parse(reader.ReadToEnd());

            return doc.RootElement.GetProperty("files")
                .EnumerateArray()
                .Single(e => e.GetProperty("path").GetString() == "manifest.json")
                .GetProperty("sha256")
                .GetString()!;
        }

        ReadManifestFileSha256(first.Content).Should().Be(ReadManifestFileSha256(second.Content));
    }
}
