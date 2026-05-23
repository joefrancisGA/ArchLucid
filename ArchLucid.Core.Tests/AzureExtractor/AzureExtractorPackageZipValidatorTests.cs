using System.IO.Compression;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorPackageZipValidatorTests
{
    [Fact]
    public void Validate_valid_package_succeeds()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 1, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
        result.FileEntryCount.Should().Be(2);
    }

    [Fact]
    public void Validate_missing_manifest_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(includeManifest: false, schemaVersion: 1, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("manifest.json");
    }

    [Fact]
    public void Validate_unsupported_schema_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 99, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("schemaVersion");
    }

    [Fact]
    public void Validate_corrupted_bytes_is_invalid_archive()
    {
        using MemoryStream stream = new([0x01, 0x02, 0x03, 0x04]);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsInvalidArchive.Should().BeTrue();
    }

    [Fact]
    public void Validate_malformed_manifest_json_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 1, includeResources: true, malformedManifest: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("valid JSON");
    }

    private static byte[] BuildZip(bool includeManifest, int schemaVersion, bool includeResources, bool malformedManifest = false)
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            if (includeManifest)
            {
                ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");

                using StreamWriter writer = new(manifest.Open());

                if (malformedManifest)
                {
                    writer.Write("{ not-valid-json");
                }
                else
                {
                    writer.Write(
                        $$"""{"schemaVersion":{{schemaVersion}},"subscriptionId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}""");
                }
            }

            if (includeResources)
            {
                ZipArchiveEntry resources = zip.CreateEntry("resources.json");

                using StreamWriter writer = new(resources.Open());

                writer.Write("[]");
            }
        }

        return ms.ToArray();
    }
}
