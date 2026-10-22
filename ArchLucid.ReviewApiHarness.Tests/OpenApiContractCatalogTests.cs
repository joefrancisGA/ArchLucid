using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OpenApiContractCatalogTests
{
    [Fact]
    public void Load_bundled_or_repo_snapshot_exposes_architecture_run_required_fields()
    {
        string path = OpenApiContractCatalog.ResolveDefaultSnapshotPath();
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(path);

        catalog.GetRequiredProperties("ArchitectureRun").Should().Contain(
            ["createdUtc", "requestId", "runId", "status", "structuralExecutionMode"]);

        catalog.GetDeclaredPropertyNames("CreateArchitectureRunResponse").Should().Contain("run");
    }

    [Fact]
    public void Schema_validator_accepts_minimal_architecture_run()
    {
        string path = OpenApiContractCatalog.ResolveDefaultSnapshotPath();
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(path);
        OpenApiSchemaValidator validator = new(catalog);

        using JsonDocument doc = JsonDocument.Parse(
            """
            {
              "runId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
              "requestId": "req-1",
              "status": "Created",
              "structuralExecutionMode": "Real",
              "createdUtc": "2026-08-10T12:00:00Z",
              "taskIds": [],
              "isPinned": false,
              "isDeadLettered": false,
              "realModeFellBackToSimulator": false
            }
            """);

        ResponseValidationResult result = validator.Validate("ArchitectureRun", doc.RootElement);
        result.Passed.Should().BeTrue(string.Join("; ", result.Errors));
    }

    [Fact]
    public void Property_completeness_rejects_unknown_property()
    {
        string path = OpenApiContractCatalog.ResolveDefaultSnapshotPath();
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(path);
        OpenApiPropertyCompletenessValidator validator = new(catalog);

        using JsonDocument doc = JsonDocument.Parse(
            """
            {
              "runId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
              "requestId": "req-1",
              "status": "Created",
              "structuralExecutionMode": "Real",
              "createdUtc": "2026-08-10T12:00:00Z",
              "notInContract": true
            }
            """);

        ResponseValidationResult result = validator.Validate("ArchitectureRun", doc.RootElement);
        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(static e => e.Contains("notInContract", StringComparison.Ordinal));
    }
}
