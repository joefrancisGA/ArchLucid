using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>Combines schema, completeness, and DTO validation for harness responses.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ResponseValidationPipelineTests
{
    [Fact]
    public void ValidateJson_accepts_contract_valid_architecture_run()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        ResponseValidationPipeline pipeline = new(catalog);

        using JsonDocument document = JsonDocument.Parse(
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

        ResponseValidationResult result = pipeline.ValidateJson(
            "ArchitectureRun",
            typeof(ArchLucid.Api.Client.Generated.ArchitectureRun),
            document.RootElement);

        result.Passed.Should().BeTrue(string.Join("; ", result.Errors));
    }

    [Fact]
    public void ValidateJson_reports_schema_and_dto_failures_together()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        ResponseValidationPipeline pipeline = new(catalog);

        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "runId": "not-a-guid",
              "requestId": "req-1",
              "status": "Created",
              "structuralExecutionMode": "Real",
              "createdUtc": "2026-08-10T12:00:00Z",
              "unexpectedField": true
            }
            """);

        ResponseValidationResult result = pipeline.ValidateJson(
            "ArchitectureRun",
            typeof(ArchLucid.Api.Client.Generated.ArchitectureRun),
            document.RootElement);

        result.Passed.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
    }
}
