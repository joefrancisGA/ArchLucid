using System.Net.Http.Headers;
using System.Text;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>RC29 package-coverage batch: harness helpers, validation results, and HTTP client factory.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReviewApiHarnessPackageCoverageBatchRc29Tests
{
    [Fact]
    public void TimedHttpResult_Succeeded_and_Failed_build_expected_steps()
    {
        TimedHttpResult ok = TimedHttpResult.Succeeded(
            "step-ok",
            12,
            "detail",
            "corr-1",
            "{}",
            ["warn"]);

        ok.Step.Passed.Should().BeTrue();
        ok.Step.Name.Should().Be("step-ok");
        ok.CorrelationId.Should().Be("corr-1");
        ok.RawJson.Should().Be("{}");
        ok.Step.ValidationErrors.Should().ContainSingle("warn");

        TimedHttpResult fail = TimedHttpResult.Failed(
            "step-fail",
            5,
            "bad",
            null,
            null,
            "hint",
            ["err"]);

        fail.Step.Passed.Should().BeFalse();
        fail.Step.FailureHint.Should().Be("hint");
        fail.Step.ValidationErrors.Should().ContainSingle("err");
    }

    [Fact]
    public void ResponseValidationResult_Combine_aggregates_failures()
    {
        ResponseValidationResult combined = ResponseValidationResult.Combine(
            ResponseValidationResult.Ok(),
            ResponseValidationResult.Fail("a"),
            ResponseValidationResult.Fail("b"));

        combined.Passed.Should().BeFalse();
        combined.Errors.Should().BeEquivalentTo(["a", "b"]);
    }

    [Fact]
    public void HarnessActorHeaders_Create_and_reject_invalid_inputs()
    {
        IReadOnlyDictionary<string, string> headers =
            HarnessActorHeaders.Create("Reviewer", "actor-id-1");

        headers[HarnessActorHeaders.ActorNameHeader].Should().Be("Reviewer");
        headers[HarnessActorHeaders.ActorIdHeader].Should().Be("actor-id-1");

        FluentActions
            .Invoking(() => HarnessActorHeaders.Create("", "id"))
            .Should()
            .Throw<ArgumentException>();

        FluentActions
            .Invoking(() => HarnessActorHeaders.Create("name", ""))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void HarnessHttpClientFactory_applies_api_key_and_bearer_from_environment()
    {
        string? priorKey = Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY");
        string? priorBearer = Environment.GetEnvironmentVariable("ARCHLUCID_BEARER_TOKEN");

        try
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", "test-key");
            Environment.SetEnvironmentVariable("ARCHLUCID_BEARER_TOKEN", "test-token");

            JourneyOptions options = new() { ApiBaseUrl = "http://127.0.0.1:5128" };
            using HttpClient http = HarnessHttpClientFactory.Create(options);

            http.BaseAddress!.ToString().Should().Be("http://127.0.0.1:5128/");
            http.DefaultRequestHeaders.Accept.Should().Contain(h =>
                h.MediaType == MediaTypeHeaderValue.Parse("application/json").MediaType);
            http.DefaultRequestHeaders.GetValues("X-Api-Key").Should().ContainSingle("test-key");
            http.DefaultRequestHeaders.Authorization!.Scheme.Should().Be("Bearer");
            http.DefaultRequestHeaders.Authorization.Parameter.Should().Be("test-token");
        }
        finally
        {
            Environment.SetEnvironmentVariable("ARCHLUCID_API_KEY", priorKey);
            Environment.SetEnvironmentVariable("ARCHLUCID_BEARER_TOKEN", priorBearer);
        }
    }

    [Fact]
    public async Task ArchitectureRequestPayloadFactory_default_payload_has_required_fields()
    {
        JourneyOptions options = new() { ApiBaseUrl = "http://127.0.0.1:5128" };

        System.Text.Json.Nodes.JsonObject payload =
            await ArchitectureRequestPayloadFactory.CreateAsync(options, CancellationToken.None);

        payload["requestId"]!.GetValue<string>().Should().StartWith("harness-");
        payload["systemName"]!.GetValue<string>().Should().Contain("ReviewApiHarness");
        payload["requiredCapabilities"]!.AsArray().Should().NotBeEmpty();
    }

    [Fact]
    public async Task ArchitectureRequestPayloadFactory_reads_json_object_from_file()
    {
        string path = Path.Combine(Path.GetTempPath(), $"arch-request-{Guid.NewGuid():N}.json");
        await File.WriteAllTextAsync(path, """{"requestId":"from-file","systemName":"File"}""");

        try
        {
            JourneyOptions options = new()
            {
                ApiBaseUrl = "http://127.0.0.1:5128",
                ArchitectureRequestJsonPath = path
            };

            System.Text.Json.Nodes.JsonObject payload =
                await ArchitectureRequestPayloadFactory.CreateAsync(options, CancellationToken.None);

            payload["requestId"]!.GetValue<string>().Should().Be("from-file");
            payload["systemName"]!.GetValue<string>().Should().Be("File");
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void RealAiExecutionGate_ReadFromRunDetail_reads_mode_fallback_and_token_totals()
    {
        using System.Text.Json.JsonDocument doc = System.Text.Json.JsonDocument.Parse(
            """
            {
              "run": {
                "structuralExecutionMode": 1,
                "realModeFellBackToSimulator": false
              },
              "agentExecutionLlmCostEstimate": {
                "tokenCounts": {
                  "prompt": 40,
                  "Completion": 15
                }
              }
            }
            """);

        (string? mode, bool fellBack, long tokens) =
            RealAiExecutionGate.ReadFromRunDetail(doc.RootElement);

        mode.Should().Be("1");
        fellBack.Should().BeFalse();
        tokens.Should().Be(55);
    }

    [Fact]
    public void DtoDeserializationValidator_rejects_additional_properties_on_generated_dto()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        DtoDeserializationValidator validator = new();

        using System.Text.Json.JsonDocument doc = System.Text.Json.JsonDocument.Parse(
            """
            {
              "runId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
              "requestId": "req-1",
              "status": "Created",
              "structuralExecutionMode": "Real",
              "createdUtc": "2026-08-10T12:00:00Z",
              "unexpectedField": true
            }
            """);

        ResponseValidationResult result = validator.Validate(typeof(ArchLucid.Api.Client.Generated.ArchitectureRun), doc.RootElement);

        result.Passed.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("unexpectedField", StringComparison.Ordinal));
    }

    [Fact]
    public void JourneyHttpExecutor_JsonContent_sets_utf8_json_media_type()
    {
        StringContent content = JourneyHttpExecutor.JsonContent("{\"a\":1}");

        content.Headers.ContentType!.MediaType.Should().Be("application/json");
        content.Headers.ContentType.CharSet.Should().Be(Encoding.UTF8.WebName);
    }
}
