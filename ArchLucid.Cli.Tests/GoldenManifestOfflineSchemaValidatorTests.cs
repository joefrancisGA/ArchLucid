using ArchLucid.Cli;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GoldenManifestOfflineSchemaValidatorTests
{
    private const string MinimalValidGoldenManifest =
        """
        {
          "runId": "11111111-1111-1111-1111-111111111111",
          "systemName": "demo",
          "services": [],
          "datastores": [],
          "relationships": [],
          "governance": {},
          "metadata": {
            "manifestVersion": "1",
            "createdUtc": "2026-01-01T00:00:00Z"
          }
        }
        """;

    [Fact]
    public void ValidateManifestFile_reports_missing_path()
    {
        ManifestValidateOutcome outcome = GoldenManifestOfflineSchemaValidator.ValidateManifestFile("   ");

        outcome.IsValid.Should().BeFalse();
        outcome.Errors.Should().ContainSingle(e => e.Message.Contains("path is required", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ValidateManifestFile_reports_missing_file()
    {
        string missing = Path.Combine(Path.GetTempPath(), $"archlucid-missing-manifest-{Guid.NewGuid():N}.json");

        ManifestValidateOutcome outcome = GoldenManifestOfflineSchemaValidator.ValidateManifestFile(missing);

        outcome.IsValid.Should().BeFalse();
        outcome.Errors.Should().ContainSingle(e => e.Message.Contains("File not found", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ValidateManifestFile_reports_empty_file()
    {
        string path = Path.Combine(Path.GetTempPath(), $"archlucid-empty-manifest-{Guid.NewGuid():N}.json");

        await File.WriteAllTextAsync(path, "   ");

        try
        {
            ManifestValidateOutcome outcome = GoldenManifestOfflineSchemaValidator.ValidateManifestFile(path);

            outcome.IsValid.Should().BeFalse();
            outcome.Errors.Should().ContainSingle(e => e.Message.Contains("empty", StringComparison.OrdinalIgnoreCase));
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public async Task ValidateManifestFile_reports_invalid_json_with_line_hint()
    {
        string path = Path.Combine(Path.GetTempPath(), $"archlucid-bad-json-{Guid.NewGuid():N}.json");

        await File.WriteAllTextAsync(path, "{ invalid");

        try
        {
            ManifestValidateOutcome outcome = GoldenManifestOfflineSchemaValidator.ValidateManifestFile(path);

            outcome.IsValid.Should().BeFalse();
            outcome.Errors.Should().ContainSingle(e => e.Message.Contains("Invalid JSON", StringComparison.OrdinalIgnoreCase));
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public async Task ValidateManifestFile_reports_non_object_root()
    {
        string path = Path.Combine(Path.GetTempPath(), $"archlucid-array-root-{Guid.NewGuid():N}.json");

        await File.WriteAllTextAsync(path, "[]");

        try
        {
            ManifestValidateOutcome outcome = GoldenManifestOfflineSchemaValidator.ValidateManifestFile(path);

            outcome.IsValid.Should().BeFalse();
            outcome.Errors.Should().ContainSingle(e => e.Message.Contains("JSON object", StringComparison.OrdinalIgnoreCase));
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public async Task ValidateManifestFile_accepts_valid_manifest_file()
    {
        string path = Path.Combine(Path.GetTempPath(), $"archlucid-valid-manifest-{Guid.NewGuid():N}.json");

        await File.WriteAllTextAsync(path, MinimalValidGoldenManifest);

        try
        {
            ManifestValidateOutcome outcome = GoldenManifestOfflineSchemaValidator.ValidateManifestFile(path);

            outcome.IsValid.Should().BeTrue();
            outcome.Errors.Should().BeEmpty();
        }
        finally
        {
            File.Delete(path);
        }
    }
}
