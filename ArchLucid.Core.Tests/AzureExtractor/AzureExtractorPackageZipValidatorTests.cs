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
    public void Validate_valid_schema_v2_package_succeeds()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 2, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
        result.IsSchemaRejection.Should().BeFalse();
        result.IsInvalidArchive.Should().BeFalse();
        result.FileEntryCount.Should().Be(2);
    }

    [Fact]
    public void Validate_rejects_malformed_optional_companion_json()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            optionalEntryName: AzureExtractorPackageZipEntryNames.RoleAssignments,
            optionalEntryJson: "{ not-valid-json");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("role-assignments.json is not valid JSON");
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
        result.ErrorDetail.Should().Contain("Supported schema versions: 1–2");
    }

    [Fact]
    public void Validate_legacy_schema_zero_is_schema_rejection()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 0, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("below the required V1 GA minimum");
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
    public void Validate_string_schemaVersion_succeeds()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 1, includeResources: true, stringSchemaVersion: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_pascal_case_schemaVersion_succeeds()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 1, includeResources: true, pascalCaseSchemaVersion: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_whole_number_double_schemaVersion_succeeds()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 1,
            includeResources: true,
            rawSchemaVersion: "1.0");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_string_whole_number_schemaVersion_succeeds()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 1,
            includeResources: true,
            rawSchemaVersion: "\"1.0\"");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_boolean_schemaVersion_fails()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 1,
            includeResources: true,
            rawSchemaVersion: "true");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("schemaVersion");
    }

    [Fact]
    public void Validate_string_boolean_schemaVersion_fails()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 1,
            includeResources: true,
            rawSchemaVersion: "\"true\"");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("schemaVersion");
    }

    [Fact]
    public void Validate_on_synonym_schemaVersion_fails()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 1,
            includeResources: true,
            rawSchemaVersion: "\"on\"");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("schemaVersion");
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

    [Fact]
    public void Validate_rejects_non_array_resources_json()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 2, includeResources: true, resourcesJson: "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("resources.json root must be a JSON array");
    }

    [Fact]
    public void Validate_rejects_non_array_role_assignments_json()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            optionalEntryName: AzureExtractorPackageZipEntryNames.RoleAssignments,
            optionalEntryJson: "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("role-assignments.json root must be a JSON array");
    }

    [Fact]
    public void Validate_rejects_non_array_diagnostic_settings_json()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            optionalEntryName: AzureExtractorPackageZipEntryNames.DiagnosticSettings,
            optionalEntryJson: "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("diagnostic-settings.json root must be a JSON array");
    }

    [Fact]
    public void Validate_rejects_non_array_network_associations_json()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            optionalEntryName: AzureExtractorPackageZipEntryNames.NetworkAssociations,
            optionalEntryJson: "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("network-associations.json root must be a JSON array");
    }

    [Fact]
    public void Validate_rejects_non_array_policy_assignments_json()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            optionalEntryName: AzureExtractorPackageZipEntryNames.PolicyAssignments,
            optionalEntryJson: "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("policy-assignments.json root must be a JSON array");
    }

    [Fact]
    public void Validate_rejects_zip_missing_resources_json()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 2, includeResources: false);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeFalse();
        result.ErrorDetail.Should().Contain("resources.json");
    }

    [Fact]
    public void Validate_resolves_optional_companion_entry_case_insensitively()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            optionalEntryName: "ROLE-ASSIGNMENTS.JSON",
            optionalEntryJson: """[{"principalId":"11111111-1111-1111-1111-111111111111"}]""");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
        result.FileEntryCount.Should().Be(3);
    }

    [Fact]
    public void ValidateFile_returns_error_when_zip_path_does_not_exist()
    {
        AzureExtractorZipValidationResult result =
            AzureExtractorPackageZipValidator.ValidateFile("/tmp/archlucid-missing-extractor-package.zip");

        result.IsValid.Should().BeFalse();
        result.IsInvalidArchive.Should().BeFalse();
        result.ErrorDetail.Should().Contain("ZIP file not found");
    }

    [Fact]
    public void CountFileEntries_ignores_directory_entries()
    {
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 2, includeResources: true);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorPackageZipValidator.CountFileEntries(stream).Should().Be(2);
    }

    [Fact]
    public void Validate_rejects_malformed_resources_json()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            resourcesJson: "{ not-valid-json");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("resources.json is not valid JSON");
    }

    [Fact]
    public void Validate_resolves_resources_entry_case_insensitively()
    {
        byte[] zipBytes = BuildZipWithEntryNames(
            manifestEntryName: "manifest.json",
            resourcesEntryName: "RESOURCES.JSON",
            schemaVersion: 2);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_accepts_valid_optional_companion_arrays()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            optionalEntryName: AzureExtractorPackageZipEntryNames.RoleAssignments,
            optionalEntryJson: """[{"principalId":"11111111-1111-1111-1111-111111111111"}]""");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
        result.FileEntryCount.Should().Be(3);
    }

    [Fact]
    public void Validate_resolves_manifest_entry_case_insensitively()
    {
        byte[] zipBytes = BuildZipWithEntryName(
            "MANIFEST.JSON",
            includeResources: true,
            schemaVersion: 2);

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateFile_validates_existing_zip_on_disk()
    {
        string zipPath = Path.Combine(Path.GetTempPath(), $"archlucid-extractor-{Guid.NewGuid():N}.zip");
        byte[] zipBytes = BuildZip(includeManifest: true, schemaVersion: 2, includeResources: true);

        File.WriteAllBytes(zipPath, zipBytes);

        try
        {
            AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.ValidateFile(zipPath);

            result.IsValid.Should().BeTrue();
            result.FileEntryCount.Should().Be(2);
        }
        finally
        {
            if (File.Exists(zipPath))
                File.Delete(zipPath);
        }
    }

    [Fact]
    public void Validate_rejects_non_array_defender_summary_json()
    {
        byte[] zipBytes = BuildZip(
            includeManifest: true,
            schemaVersion: 2,
            includeResources: true,
            optionalEntryName: AzureExtractorPackageZipEntryNames.DefenderSummary,
            optionalEntryJson: "{}");

        using MemoryStream stream = new(zipBytes);

        AzureExtractorZipValidationResult result = AzureExtractorPackageZipValidator.Validate(stream);

        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("defender-summary.json root must be a JSON array");
    }

    private static byte[] BuildZip(
        bool includeManifest,
        int schemaVersion,
        bool includeResources,
        bool malformedManifest = false,
        bool pascalCaseSchemaVersion = false,
        bool stringSchemaVersion = false,
        string? rawSchemaVersion = null,
        string resourcesJson = "[]",
        string? optionalEntryName = null,
        string? optionalEntryJson = null)
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
                    string schemaProperty = pascalCaseSchemaVersion ? "SchemaVersion" : "schemaVersion";
                    string schemaValue = rawSchemaVersion
                        ?? (stringSchemaVersion ? "\"1\"" : schemaVersion.ToString());
                    writer.Write(
                        $$"""{"{{schemaProperty}}":{{schemaValue}},"subscriptionId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}""");
                }
            }

            if (includeResources)
            {
                ZipArchiveEntry resources = zip.CreateEntry("resources.json");

                using StreamWriter writer = new(resources.Open());

                writer.Write(resourcesJson);
            }

            if (optionalEntryName is not null && optionalEntryJson is not null)
            {
                ZipArchiveEntry optional = zip.CreateEntry(optionalEntryName);

                using StreamWriter writer = new(optional.Open());

                writer.Write(optionalEntryJson);
            }
        }

        return ms.ToArray();
    }

    private static byte[] BuildZipWithEntryName(
        string manifestEntryName,
        bool includeResources,
        int schemaVersion,
        string resourcesJson = "[]") =>
        BuildZipWithEntryNames(manifestEntryName, "resources.json", schemaVersion, resourcesJson);

    private static byte[] BuildZipWithEntryNames(
        string manifestEntryName,
        string resourcesEntryName,
        int schemaVersion,
        string resourcesJson = "[]")
    {
        using MemoryStream ms = new();

        using (ZipArchive zip = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifest = zip.CreateEntry(manifestEntryName);

            using (StreamWriter writer = new(manifest.Open()))
            {
                writer.Write(
                    $$"""{"schemaVersion":{{schemaVersion}},"subscriptionId":"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"}""");
            }

            ZipArchiveEntry resources = zip.CreateEntry(resourcesEntryName);

            using StreamWriter resourcesWriter = new(resources.Open());

            resourcesWriter.Write(resourcesJson);
        }

        return ms.ToArray();
    }
}
