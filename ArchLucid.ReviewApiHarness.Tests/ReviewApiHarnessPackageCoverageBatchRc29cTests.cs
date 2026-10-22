using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>RC29c harness coverage: catalog branches, status readers, real-AI gate, and HTTP executor edges.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ReviewApiHarnessPackageCoverageBatchRc29cTests
{
    [Fact]
    public void OpenApiContractCatalog_Load_rejects_blank_path()
    {
        FluentActions
            .Invoking(() => OpenApiContractCatalog.Load("   "))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void OpenApiContractCatalog_Load_rejects_snapshot_without_components_schemas()
    {
        string path = WriteTempSnapshot("""{"openapi":"3.0.0","info":{"title":"x","version":"1"}}""");

        try
        {
            FluentActions
                .Invoking(() => OpenApiContractCatalog.Load(path))
                .Should()
                .Throw<InvalidOperationException>()
                .WithMessage("*components.schemas*");
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void OpenApiContractCatalog_TryGetSchemaNode_and_metadata_helpers_handle_unknown_schema()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());

        catalog.TryGetSchemaNode("NotARealHarnessSchema", out JsonObject schemaNode).Should().BeFalse();
        schemaNode.Should().BeNull();

        catalog.GetRequiredProperties("NotARealHarnessSchema").Should().BeEmpty();
        catalog.GetDeclaredPropertyNames("NotARealHarnessSchema").Should().BeEmpty();
        catalog.ResolvePropertySchema("ArchitectureRun", "notAProperty").Should().BeNull();

        FluentActions
            .Invoking(() => catalog.GetEvaluatorSchema("NotARealHarnessSchema"))
            .Should()
            .Throw<InvalidOperationException>();
    }

    [Fact]
    public void OpenApiContractCatalog_GetEvaluatorSchema_reuses_cached_schema()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());

        Json.Schema.JsonSchema first = catalog.GetEvaluatorSchema("ArchitectureRun");
        Json.Schema.JsonSchema second = catalog.GetEvaluatorSchema("ArchitectureRun");

        ReferenceEquals(first, second).Should().BeTrue();
    }

    [Fact]
    public void OpenApiSchemaValidator_rejects_blank_schema_name()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        OpenApiSchemaValidator validator = new(catalog);

        using JsonDocument document = JsonDocument.Parse("{}");

        FluentActions
            .Invoking(() => validator.Validate("   ", document.RootElement))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void OpenApiSchemaValidator_collects_schema_validation_errors()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        OpenApiSchemaValidator validator = new(catalog);

        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "runId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
              "requestId": "req-1",
              "structuralExecutionMode": "Real",
              "createdUtc": "not-a-timestamp"
            }
            """);

        ResponseValidationResult result = validator.Validate("ArchitectureRun", document.RootElement);

        result.Passed.Should().BeFalse();
        result.Errors.Should().NotBeEmpty();
    }

    [Theory]
    [InlineData(null, false, 0L, true)]
    [InlineData("Simulator", false, 10L, true)]
    [InlineData("Real", true, 10L, true)]
    [InlineData("Real", false, 0L, true)]
    [InlineData("1", false, 5L, false)]
    public void RealAiExecutionGate_Evaluate_enforces_real_mode_and_token_rules(
        string? mode,
        bool fellBack,
        long tokens,
        bool shouldFail)
    {
        ResponseValidationResult result = RealAiExecutionGate.Evaluate(mode, fellBack, tokens, requireNonZeroLlmTokens: true);

        result.Passed.Should().Be(!shouldFail);
    }

    [Fact]
    public void RealAiExecutionGate_ReadFromRunDetail_reads_results_array_token_totals()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "run": { "structuralExecutionMode": "Real" },
              "results": [
                { "promptTokens": "12", "completionTokens": 3 },
                { "PromptTokens": 4, "CompletionTokens": 1 }
              ]
            }
            """);

        (string? mode, bool fellBack, long tokens) = RealAiExecutionGate.ReadFromRunDetail(document.RootElement);

        mode.Should().Be("Real");
        fellBack.Should().BeFalse();
        tokens.Should().Be(20);
    }

    [Fact]
    public void ArchitectureRunStatusReader_reads_runId_status_manifest_and_approval_fields()
    {
        using JsonDocument createDoc = JsonDocument.Parse(
            """{"run":{"runId":42,"status":"4"}}""");

        ArchitectureRunStatusReader.ReadRunId(createDoc.RootElement).Should().Be("42");
        ArchitectureRunStatusReader.ReadStatus(createDoc.RootElement).Should().Be("4");
        ArchitectureRunStatusReader.IsReadyForCommitOrCommitted("4").Should().BeTrue();

        using JsonDocument detailDoc = JsonDocument.Parse(
            """{"run":{"currentManifestVersion":"manifest-v2"}}""");

        ArchitectureRunStatusReader.ReadManifestVersion(detailDoc.RootElement).Should().Be("manifest-v2");

        using JsonDocument approvalDoc = JsonDocument.Parse("""{"approvalRequestId":"approval-42"}""");

        ArchitectureRunStatusReader.ReadApprovalRequestId(approvalDoc.RootElement).Should().Be("approval-42");
    }

    [Theory]
    [InlineData("ExecutionCompletedQualityRejected", true)]
    [InlineData("FailedPartial", true)]
    [InlineData("8", true)]
    [InlineData("10", true)]
    public void ArchitectureRunStatusReader_IsTerminalFailure_maps_quality_rejection_codes(string status, bool expected)
    {
        ArchitectureRunStatusReader.IsTerminalFailure(status).Should().Be(expected);
    }

    [Fact]
    public void JourneyOptionsParser_parses_actor_and_openapi_flags()
    {
        JourneyOptions? options = JourneyOptionsParser.Parse(
            [
                "--api-base-url", "http://localhost:5128/",
                "--openapi-snapshot", "snapshot.json",
                "--submitter-actor-name", "Submitter",
                "--submitter-actor-id", "submitter-1",
                "--reviewer-actor-name", "Reviewer",
                "--reviewer-actor-id", "reviewer-1",
            ],
            out string? error);

        error.Should().BeNull();
        options.Should().NotBeNull();
        options!.OpenApiSnapshotPath.Should().Be("snapshot.json");
        options.SubmitterActorName.Should().Be("Submitter");
        options.ReviewerActorId.Should().Be("reviewer-1");
    }

    [Fact]
    public void JourneyOptionsParser_help_and_missing_flag_value_return_usage_errors()
    {
        JourneyOptionsParser.Parse(["--help"], out string? helpError).Should().BeNull();
        helpError.Should().BeNull();

        JourneyOptions? missingValue = JourneyOptionsParser.Parse(
            ["--api-base-url"],
            out string? missingError);

        missingValue.Should().BeNull();
        missingError.Should().Contain("Missing value");
    }

    [Fact]
    public void JourneyOptionsParser_WriteUsage_writes_operator_guidance()
    {
        using StringWriter writer = new();

        JourneyOptionsParser.WriteUsage(writer);

        writer.ToString().Should().Contain("ArchLucid.ReviewApiHarness");
        writer.ToString().Should().Contain("ARCHLUCID_API_KEY");
    }

    [Fact]
    public async Task JourneyHttpExecutor_SendBinaryAsync_handles_transport_and_http_errors()
    {
        using DelegatingTestHttpHandler transportHandler = new((_, _) =>
            throw new HttpRequestException("binary transport down"));

        using HttpClient transportClient = new(transportHandler) { BaseAddress = new Uri("http://harness.test/") };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyHttpExecutor transportExecutor = new(transportClient, new ResponseValidationPipeline(catalog));

        TimedHttpResult transportResult = await transportExecutor.SendBinaryAsync(
            "binary-transport",
            HttpMethod.Get,
            "v1/artifacts/runs/run-1/export",
            CancellationToken.None);

        transportResult.Step.Passed.Should().BeFalse();
        transportResult.Step.Detail.Should().Contain("Transport error");

        using DelegatingTestHttpHandler statusHandler = new((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden)
            {
                Content = new StringContent("denied", Encoding.UTF8, "text/plain"),
            }));

        using HttpClient statusClient = new(statusHandler) { BaseAddress = new Uri("http://harness.test/") };
        JourneyHttpExecutor statusExecutor = new(statusClient, new ResponseValidationPipeline(catalog));

        TimedHttpResult statusResult = await statusExecutor.SendBinaryAsync(
            "binary-forbidden",
            HttpMethod.Get,
            "v1/artifacts/runs/run-1/export",
            CancellationToken.None);

        statusResult.Step.Passed.Should().BeFalse();
        statusResult.Step.Detail.Should().Contain("HTTP 403");
    }

    [Fact]
    public void OpenApiPropertyCompletenessValidator_reports_unknown_schema_and_nested_arrays()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        OpenApiPropertyCompletenessValidator validator = new(catalog);

        ResponseValidationResult unknownSchema = validator.Validate("NotAHarnessSchema", JsonDocument.Parse("{}").RootElement);
        unknownSchema.Passed.Should().BeFalse();
        unknownSchema.Errors.Should().Contain(e => e.Contains("Unknown OpenAPI schema", StringComparison.Ordinal));

        using JsonDocument findings = JsonDocument.Parse(
            """
            {
              "items": [
                {
                  "findingId": "finding-1",
                  "title": "Gap",
                  "severity": "High",
                  "status": "Open"
                }
              ],
              "hasMore": false,
              "requestedTake": 50
            }
            """);

        ResponseValidationResult nested = validator.Validate("RunFindingsListResponse", findings.RootElement);
        nested.Passed.Should().BeFalse();
        nested.Errors.Should().NotBeEmpty();
    }

    [Fact]
    public void OpenApiContractCatalog_resolves_property_refs_and_declared_names()
    {
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());

        JsonObject? runPropertySchema = catalog.ResolvePropertySchema("CreateArchitectureRunResponse", "run");
        runPropertySchema.Should().NotBeNull();
        catalog.GetDeclaredPropertyNames("ArchitectureRun").Should().Contain("runId");
        catalog.GetRequiredProperties("ArchitectureRun").Should().Contain("status");
    }

    [Fact]
    public void DtoDeserializationValidator_traverses_nested_objects_and_collections()
    {
        DtoDeserializationValidator validator = new();

        using JsonDocument nestedAdditional = JsonDocument.Parse(
            """
            {
              "run": {
                "runId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                "requestId": "req-1",
                "status": "Created",
                "structuralExecutionMode": "Real",
                "createdUtc": "2026-08-10T12:00:00Z",
                "taskIds": [],
                "isPinned": false,
                "isDeadLettered": false,
                "realModeFellBackToSimulator": false,
                "nestedUnexpected": true
              }
            }
            """);

        ResponseValidationResult nestedResult = validator.Validate(
            typeof(ArchLucid.Api.Client.Generated.CreateArchitectureRunResponse),
            nestedAdditional.RootElement);

        nestedResult.Passed.Should().BeFalse();
        nestedResult.Errors.Should().Contain(e => e.Contains("AdditionalProperties", StringComparison.Ordinal));

        using JsonDocument invalidJson = JsonDocument.Parse("\"not-an-object\"");

        ResponseValidationResult deserializeFailure = validator.Validate(
            typeof(ArchLucid.Api.Client.Generated.ArchitectureRun),
            invalidJson.RootElement);

        deserializeFailure.Passed.Should().BeFalse();
        deserializeFailure.Errors.Should().Contain(e => e.Contains("DTO deserialize", StringComparison.Ordinal));
    }

    [Fact]
    public void JourneyReport_and_step_result_property_bags_roundtrip()
    {
        JourneyStepResult step = new()
        {
            Name = "probe",
            Passed = true,
            Detail = "ok",
            ElapsedMilliseconds = 12,
            FailureHint = "hint",
            ValidationErrors = ["warn"],
        };

        JourneyReport report = new()
        {
            Steps = [step],
            AllPassed = true,
            RunId = ReviewApiHarnessValidPayloads.RunId,
            CorrelationId = "corr",
            FinalRunStatus = "Committed",
            ManifestVersion = ReviewApiHarnessValidPayloads.ManifestVersion,
            ApprovalRequestId = ReviewApiHarnessValidPayloads.ApprovalRequestId,
            TotalLlmTokens = 42,
            StructuralExecutionMode = "Real",
            TotalElapsedMilliseconds = 99,
        };

        report.Steps.Should().ContainSingle();
        report.ManifestVersion.Should().Be(ReviewApiHarnessValidPayloads.ManifestVersion);
        step.ValidationErrors.Should().ContainSingle("warn");
    }

    [Fact]
    public void JourneyOptionsParser_rejects_invalid_poll_interval()
    {
        JourneyOptions? options = JourneyOptionsParser.Parse(
            ["--api-base-url", "http://localhost", "--poll-interval-seconds", "99"],
            out string? error);

        options.Should().BeNull();
        error.Should().Contain("poll-interval-seconds");
    }

    [Fact]
    public async Task OperatorReviewJourneyRunner_retries_poll_after_transient_5xx()
    {
        int reviewGetCount = 0;

        using DelegatingTestHttpHandler handler = new(async (request, _) =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.EndsWith("/health/ready", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, "{}");
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/v1/architecture/request", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.Created, ReviewApiHarnessValidPayloads.CreateArchitectureRunResponse());
            }

            if (request.Method == HttpMethod.Get &&
                path.Contains("/v1/architecture/review/", StringComparison.OrdinalIgnoreCase) &&
                !path.Contains("/findings", StringComparison.OrdinalIgnoreCase))
            {
                reviewGetCount++;

                if (reviewGetCount == 2)
                {
                    return Json(HttpStatusCode.ServiceUnavailable, """{"detail":"transient"}""");
                }

                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunDetailReadyForCommit());
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/execute", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, "{}");
            }

            if (path.Contains("/findings", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunFindingsListResponse());
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/finalize", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.CommitRunResponse());
            }

            if (path.Contains("/export", StringComparison.OrdinalIgnoreCase))
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent([0x50, 0x4b, 0x03, 0x04]),
                };
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/v1/governance/approval-requests", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.GovernanceApprovalRequest());
            }

            if (request.Method == HttpMethod.Post && path.Contains("/approval-requests/", StringComparison.OrdinalIgnoreCase) &&
                path.EndsWith("/approve", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.GovernanceApprovalRequest());
            }

            if (path.Contains("/v1/audit/search", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.CursorPagedAuditEvents());
            }

            if (path.StartsWith("/v1/architecture/runs", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.CursorPagedRunListItems());
            }

            return Json(HttpStatusCode.NotFound, """{"detail":"unmocked"}""");
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://review-harness.test/") };
        OperatorReviewJourneyRunner runner = CreateRunner(http);

        JourneyReport report = await runner.RunAsync();

        reviewGetCount.Should().BeGreaterThan(2);
        report.AllPassed.Should().BeTrue();
        report.Steps.Should().Contain(s => s.Name == "poll-until-ready" && s.Passed);
    }

    [Fact]
    public async Task OperatorReviewJourneyRunner_fails_when_finalize_omits_manifest_version()
    {
        using DelegatingTestHttpHandler handler = new(async (request, _) =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.EndsWith("/health/ready", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, "{}");
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/v1/architecture/request", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.Created, ReviewApiHarnessValidPayloads.CreateArchitectureRunResponse());
            }

            if (request.Method == HttpMethod.Get &&
                path.Contains("/v1/architecture/review/", StringComparison.OrdinalIgnoreCase) &&
                !path.Contains("/findings", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunDetailReadyForCommit());
            }

            if (path.Contains("/findings", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunFindingsListResponse());
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/finalize", StringComparison.OrdinalIgnoreCase))
            {
                return Json(
                    HttpStatusCode.OK,
                    """
                    {
                      "manifest": {
                        "runId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                        "systemName": "Harness",
                        "services": [],
                        "datastores": [],
                        "relationships": [],
                        "governance": {
                          "complianceTags": [],
                          "policyConstraints": [],
                          "requiredControls": []
                        },
                        "metadata": {}
                      }
                    }
                    """);
            }

            return Json(HttpStatusCode.NotFound, """{"detail":"unmocked"}""");
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://review-harness.test/") };
        OperatorReviewJourneyRunner runner = CreateRunner(http);

        JourneyReport report = await runner.RunAsync();

        report.AllPassed.Should().BeFalse();
        report.Steps.Should().Contain(s => s.Name == "finalize-manifestVersion" && !s.Passed);
    }

    [Fact]
    public async Task OperatorReviewJourneyRunner_fails_when_runs_list_omits_created_run()
    {
        using DelegatingTestHttpHandler handler = new(async (request, _) =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.EndsWith("/health/ready", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, "{}");
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/v1/architecture/request", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.Created, ReviewApiHarnessValidPayloads.CreateArchitectureRunResponse());
            }

            if (request.Method == HttpMethod.Get &&
                path.Contains("/v1/architecture/review/", StringComparison.OrdinalIgnoreCase) &&
                !path.Contains("/findings", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunDetailReadyForCommit());
            }

            if (path.Contains("/findings", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunFindingsListResponse());
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/finalize", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.CommitRunResponse());
            }

            if (path.Contains("/export", StringComparison.OrdinalIgnoreCase))
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new ByteArrayContent([0x50, 0x4b, 0x03, 0x04]),
                };
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/v1/governance/approval-requests", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.GovernanceApprovalRequest());
            }

            if (request.Method == HttpMethod.Post && path.Contains("/approval-requests/", StringComparison.OrdinalIgnoreCase) &&
                path.EndsWith("/approve", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.GovernanceApprovalRequest());
            }

            if (path.Contains("/v1/audit/search", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.CursorPagedAuditEvents());
            }

            if (path.StartsWith("/v1/architecture/runs", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, """{"items":[],"hasMore":false,"requestedTake":50}""");
            }

            return Json(HttpStatusCode.NotFound, """{"detail":"unmocked"}""");
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://review-harness.test/") };
        OperatorReviewJourneyRunner runner = CreateRunner(http);

        JourneyReport report = await runner.RunAsync();

        report.AllPassed.Should().BeFalse();
        report.Steps.Should().Contain(s => s.Name == "runs-list-contains-run" && !s.Passed);
    }

    private static OperatorReviewJourneyRunner CreateRunner(HttpClient http)
    {
        JourneyOptions options = new()
        {
            ApiBaseUrl = "http://review-harness.test",
            TimeoutSeconds = 30,
            PollIntervalSeconds = 1,
            RequireNonZeroLlmTokens = false,
        };

        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());

        return new OperatorReviewJourneyRunner(http, options, catalog);
    }

    private static HttpResponseMessage Json(HttpStatusCode status, string json) =>
        new(status)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };

    private static string WriteTempSnapshot(string json)
    {
        string path = Path.Combine(Path.GetTempPath(), $"openapi-harness-{Guid.NewGuid():N}.json");
        File.WriteAllText(path, json);

        return path;
    }
}
