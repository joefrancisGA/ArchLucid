using System.IO.Compression;

using ArchLucid.Core.CloudInventoryExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.CloudInventoryExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CloudInventoryExtractorPackageZipValidatorTests
{
    [Fact]
    public void Validate_valid_package_succeeds()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 1, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
        result.FileEntryCount.Should().Be(2);
    }

    [Fact]
    public void Validate_missing_manifest_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(includeManifest: false, schemaVersion: 1, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("manifest.json");
    }

    [Fact]
    public void Validate_unsupported_schema_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 99, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("schemaVersion");
        result.ErrorDetail.Should().Contain("Required schemaVersion: 1");
    }

    [Fact]
    public void Validate_legacy_schema_zero_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 0, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("below the required V1 GA minimum");
        result.ErrorDetail.Should().Contain("Get-ArchLucidAwsPackage.ps1");
    }

    [Fact]
    public void Validate_corrupted_bytes_is_invalid_archive()
    {
        using MemoryStream stream = new([0x01, 0x02, 0x03, 0x04]);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsInvalidArchive.Should().BeTrue();
    }

    [Fact]
    public void Validate_string_schemaVersion_succeeds()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 1, includeResources: true, stringSchemaVersion: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_boolean_schemaVersion_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 1,
            includeResources: true,
            booleanSchemaVersion: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
    }

    [Fact]
    public void Validate_string_boolean_schemaVersion_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 1,
            includeResources: true,
            stringBooleanSchemaVersion: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("schemaVersion");
    }

    [Fact]
    public void Validate_on_synonym_schemaVersion_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 1,
            includeResources: true,
            stringOnSchemaVersion: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("schemaVersion");
    }

    [Fact]
    public void Validate_zip_slip_non_manifest_entry_path_is_invalid_archive()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");

            using (StreamWriter writer = new(manifest.Open()))
            {
                writer.Write("""{"schemaVersion":1,"cloudProvider":"Aws","accountId":"123456789012"}""");
            }

            ZipArchiveEntry resources = zip.CreateEntry("resources.json");

            using (StreamWriter writer = new(resources.Open()))
            {
                writer.Write("[]");
            }

            zip.CreateEntry("../evil.txt");
        }

        ms.Position = 0;

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(ms);

        result.IsValid.Should().BeFalse();
        result.IsInvalidArchive.Should().BeTrue();
        result.ErrorDetail.Should().Contain("Unsafe ZIP entry path");
    }

    [Fact]
    public void Validate_malformed_manifest_json_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 1, includeResources: true, malformedManifest: true);

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("valid JSON");
    }

    [Fact]
    public void Validate_zip_slip_entry_path_is_invalid_archive()
    {
        byte[] zipBytes = BuildZipWithZipSlipEntry();

        using MemoryStream stream = new(zipBytes);

        CloudInventoryExtractorZipValidationResult result = CloudInventoryExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsInvalidArchive.Should().BeTrue();
        result.ErrorDetail.Should().Contain("Unsafe ZIP entry path");
    }

    private static byte[] BuildZipWithZipSlipEntry()
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry slip = zip.CreateEntry("../manifest.json");

            using (StreamWriter writer = new(slip.Open()))
            {
                writer.Write("""{"schemaVersion":1,"cloudProvider":"Aws","accountId":"123456789012"}""");
            }

            ZipArchiveEntry manifest = zip.CreateEntry("manifest.json");

            using (StreamWriter writer = new(manifest.Open()))
            {
                writer.Write("""{"schemaVersion":1,"cloudProvider":"Aws","accountId":"123456789012"}""");
            }

            ZipArchiveEntry resources = zip.CreateEntry("resources.json");

            using (StreamWriter writer = new(resources.Open()))
            {
                writer.Write("[]");
            }
        }

        return ms.ToArray();
    }

    private static byte[] BuildZip(
        bool includeManifest,
        int schemaVersion,
        bool includeResources,
        bool malformedManifest = false,
        bool stringSchemaVersion = false,
        bool booleanSchemaVersion = false,
        bool stringBooleanSchemaVersion = false,
        bool stringOnSchemaVersion = false)
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
                    string schemaValue = stringOnSchemaVersion
                        ? "\"on\""
                        : stringBooleanSchemaVersion
                        ? "\"true\""
                        : booleanSchemaVersion
                            ? "true"
                            : stringSchemaVersion ? "\"1\"" : schemaVersion.ToString();
                    writer.Write(
                        $$"""{"schemaVersion":{{schemaValue}},"cloudProvider":"Aws","accountId":"123456789012"}""");
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
