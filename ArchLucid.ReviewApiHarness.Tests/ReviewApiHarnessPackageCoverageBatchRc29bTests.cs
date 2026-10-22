using System.Text.Json;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>RC29b harness coverage: payload factory, parser branches, and property completeness validator.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReviewApiHarnessPackageCoverageBatchRc29bTests
{
    [Fact]
    public async Task ArchitectureRequestPayloadFactory_builds_default_wizard_payload()
    {
        JourneyOptions options = new() { ApiBaseUrl = "http://localhost" };

        System.Text.Json.Nodes.JsonObject payload = await ArchitectureRequestPayloadFactory.CreateAsync(options, CancellationToken.None);

        payload["systemName"]!.GetValue<string>().Should().Contain("ReviewApiHarness");
        payload["requiredCapabilities"]!.AsArray().Should().NotBeEmpty();
    }

    [Fact]
    public async Task ArchitectureRequestPayloadFactory_reads_json_object_from_file()
    {
        string path = Path.Combine(Path.GetTempPath(), $"archlucid-harness-request-{Guid.NewGuid():N}.json");
        await File.WriteAllTextAsync(path, """{"requestId":"from-file","systemName":"From file"}""");

        try
        {
            JourneyOptions options = new()
            {
                ApiBaseUrl = "http://localhost",
                ArchitectureRequestJsonPath = path,
            };

            System.Text.Json.Nodes.JsonObject payload = await ArchitectureRequestPayloadFactory.CreateAsync(options, CancellationToken.None);

            payload["systemName"]!.GetValue<string>().Should().Be("From file");
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void JourneyOptionsParser_reads_api_url_from_environment()
    {
        string? prior = Environment.GetEnvironmentVariable("ARCHLUCID_API_URL");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", "https://api.example.test/");

            JourneyOptions? options = JourneyOptionsParser.Parse([], out string? error);

            error.Should().BeNull();
            options!.ApiBaseUrl.Should().Be("https://api.example.test");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_URL", prior);
        }
    }

    [Fact]
    public void JourneyOptionsParser_rejects_timeout_out_of_range()
    {
        JourneyOptions? options = JourneyOptionsParser.Parse(
            ["--api-base-url", "http://localhost", "--timeout-seconds", "9999"],
            out string? error);

        options.Should().BeNull();
        error.Should().Contain("timeout-seconds");
    }

    [Fact]
    public void OpenApiPropertyCompletenessValidator_reports_missing_required_properties()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        OpenApiPropertyCompletenessValidator validator = new(catalog);

        using JsonDocument document = JsonDocument.Parse("{}");
        ResponseValidationResult result = validator.Validate("ArchitectureRun", document.RootElement);

        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("Missing required property", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void DtoDeserializationValidator_reports_additional_properties_bucket()
    {
        DtoDeserializationValidator validator = new();

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
              "realModeFellBackToSimulator": false,
              "unexpectedHarnessField": true
            }
            """);

        ResponseValidationResult result = validator.Validate(
            typeof(ArchLucid.Api.Client.Generated.ArchitectureRun),
            document.RootElement);

        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("AdditionalProperties", StringComparison.OrdinalIgnoreCase));
    }
}
