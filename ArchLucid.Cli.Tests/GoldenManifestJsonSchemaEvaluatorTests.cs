using ArchLucid.Cli;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GoldenManifestJsonSchemaEvaluatorTests
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
    public void ValidateJson_returns_error_when_payload_empty()
    {
        GoldenManifestJsonSchemaEvaluator.Evaluation result =
            GoldenManifestJsonSchemaEvaluator.ValidateJson("   ");

        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Contains("empty", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ValidateJson_returns_error_when_json_malformed()
    {
        GoldenManifestJsonSchemaEvaluator.Evaluation result =
            GoldenManifestJsonSchemaEvaluator.ValidateJson("{ not-json");

        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(e => e.Contains("could not be parsed", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void ValidateJson_accepts_minimal_valid_manifest()
    {
        GoldenManifestJsonSchemaEvaluator.Evaluation result =
            GoldenManifestJsonSchemaEvaluator.ValidateJson(MinimalValidGoldenManifest);

        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void ValidateJson_reports_schema_violation_for_missing_required_fields()
    {
        GoldenManifestJsonSchemaEvaluator.Evaluation result =
            GoldenManifestJsonSchemaEvaluator.ValidateJson("""{"systemName":"demo"}""");

        result.IsValid.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
        result.DetailedErrors.Should().NotBeEmpty();
    }
}
