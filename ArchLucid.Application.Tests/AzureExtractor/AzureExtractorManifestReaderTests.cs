using System.IO.Compression;

using ArchLucid.Application.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AzureExtractor;

public sealed class AzureExtractorManifestReaderTests
{
    [Fact]
    public void TryRead_normalized_when_manifest_valid_returns_manifest()
    {
        using MemoryStream zip = ZipWithManifest(MinimalManifestJson(schemaVersion: 1));

        (AzureExtractorNormalizedManifest? m, string? err) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(zip);

        err.Should().BeNull();
        m.Should().NotBeNull();
        m.SchemaVersion.Should().Be(1);
        m.SubscriptionId.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryRead_unknown_schema_returns_error()
    {
        using MemoryStream zip = ZipWithManifest(MinimalManifestJson(schemaVersion: 404));

        (AzureExtractorNormalizedManifest? m, string? err) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(zip);

        m.Should().BeNull();

        err.Should().Contain("Unsupported manifest schemaVersion");
    }

    [Fact]
    public void TryRead_zip_without_manifest_returns_error()
    {
        using MemoryStream zip = ZipPlain("readme.txt", "hello");

        (AzureExtractorNormalizedManifest? m, string? err) =
            AzureExtractorManifestReader.TryReadNormalizedFromZip(zip);

        m.Should().BeNull();

        err.Should().Contain("manifest");
    }

    private static string MinimalManifestJson(int schemaVersion)
    {
        return $$"""

                 {"schemaVersion":{{schemaVersion}},"scriptVersion":"1.0","collectionTimestamp":"2026-05-06T13:01:02Z",

                 "subscriptionId":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","scope":"/sub/x","switchesUsed":[],"azModuleVersion":"test"}

                 """;
    }

    private static MemoryStream ZipPlain(string entryName, string content)

    {
        MemoryStream ms = new();

        using (ZipArchive z = new(ms, ZipArchiveMode.Create, leaveOpen: true))

        {
            ZipArchiveEntry e = z.CreateEntry(entryName);

            using StreamWriter w = new(e.Open());

            w.Write(content);
        }

        ms.Position = 0;

        return ms;
    }

    private static MemoryStream ZipWithManifest(string manifestJson)

    {
        MemoryStream ms = new();

        using (ZipArchive z = new(ms, ZipArchiveMode.Create, leaveOpen: true))

        {
            ZipArchiveEntry e = z.CreateEntry("manifest.json");

            using StreamWriter w = new(e.Open());

            w.Write(manifestJson);
        }

        ms.Position = 0;

        return ms;
    }
}
