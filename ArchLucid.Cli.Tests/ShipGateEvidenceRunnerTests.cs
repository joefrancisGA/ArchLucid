using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Cli;
using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ShipGateEvidenceRunnerTests
{
    private const string BaseUrl = "https://pilot.archlucid.test";
    private const string RunId = "11111111-1111-1111-1111-111111111111";
    private const string AlternateTenantId = "44444444-4444-4444-4444-444444444444";
    private const string AlternateWorkspaceId = "55555555-5555-5555-5555-555555555555";
    private const string AlternateProjectId = "66666666-6666-6666-6666-666666666666";

    [Fact]
    public async Task RunAsync_CommittedRunAndExportProbes_PassesGates1_2_3_4()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                if (TryHandleTenantIsolationRequest(req, out HttpResponseMessage? isolationResponse))
                    return Task.FromResult(isolationResponse!);

                if (TryHandleExportMatrixRequest(req, out HttpResponseMessage? exportResponse))
                    return Task.FromResult(exportResponse!);

                if (TryHandleFirstReviewCompletionRequest(req, out HttpResponseMessage? completionResponse))
                    return Task.FromResult(completionResponse!);

                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/architecture/run/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(
                        HttpStatusCode.OK,
                        BuildRunPayload(ArchitectureRunStatus.Committed, "v1.0.0", BuildCitationCompliantResults())));
                }

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new[]
                    {
                        new { artifactId = Guid.NewGuid().ToString("D") },
                    }));
                }

                if (path.EndsWith("/v1/roi/executive-summary", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        totalEstimatedUsdSavings = 1234.56m,
                        systems = new[] { new { systemName = "demo" } },
                        basisBreakdown = new { openFindingsEstimatedUsd = 50m },
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        ShipGateEvidenceRunner runner = new(http, alternateScopeClientFactory: () => CreateAlternateClient(handler));

        ShipGateEvidenceReport report = await runner.RunAsync(RunId);

        report.Gates.Should().Contain(g => g.GateNumber == 1 && g.Verdict == ShipGateEvidenceVerdict.Pass);
        report.Gates.Should().Contain(g => g.GateNumber == 2 && g.Verdict == ShipGateEvidenceVerdict.Pass);
        report.Gates.Should().Contain(g => g.GateNumber == 3 && g.Verdict == ShipGateEvidenceVerdict.Pass);
        report.Gates.Should().Contain(g => g.GateNumber == 4 && g.Verdict == ShipGateEvidenceVerdict.Pass);
        report.Gates.Should().Contain(g => g.GateNumber == 5 && g.Verdict == ShipGateEvidenceVerdict.Unknown);
        report.Gates.Should().Contain(g => g.GateNumber == 6 && g.Verdict == ShipGateEvidenceVerdict.Pass);
    }

    [Fact]
    public async Task RunAsync_MissingCitationEvidence_FailsGate2()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                if (TryHandleTenantIsolationRequest(req, out HttpResponseMessage? isolationResponse))
                    return Task.FromResult(isolationResponse!);

                if (TryHandleExportMatrixRequest(req, out HttpResponseMessage? exportResponse))
                    return Task.FromResult(exportResponse!);

                if (TryHandleFirstReviewCompletionRequest(req, out HttpResponseMessage? completionResponse))
                    return Task.FromResult(completionResponse!);

                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/architecture/run/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(
                        HttpStatusCode.OK,
                        BuildRunPayload(ArchitectureRunStatus.Committed, "v1.0.0", BuildCitationFailingResults())));
                }

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, Array.Empty<object>()));
                }

                if (path.EndsWith("/v1/roi/executive-summary", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        totalEstimatedUsdSavings = 0m,
                        systems = Array.Empty<object>(),
                        basisBreakdown = new { openFindingsEstimatedUsd = 0m },
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        ShipGateEvidenceRunner runner = new(http, alternateScopeClientFactory: () => CreateAlternateClient(handler));

        ShipGateEvidenceReport report = await runner.RunAsync(RunId);

        report.Gates.Should().Contain(g => g.GateNumber == 2 && g.Verdict == ShipGateEvidenceVerdict.Fail);
        report.AnyFail.Should().BeTrue();
    }

    [Fact]
    public async Task RunAsync_MissingRun_FailsGate1()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                if (TryHandleTenantIsolationRequest(req, out HttpResponseMessage? isolationResponse))
                    return Task.FromResult(isolationResponse!);

                if (TryHandleExportMatrixRequest(req, out HttpResponseMessage? exportResponse))
                    return Task.FromResult(exportResponse!);

                if (TryHandleFirstReviewCompletionRequest(req, out HttpResponseMessage? completionResponse))
                    return Task.FromResult(completionResponse!);

                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/architecture/run/{RunId}", StringComparison.Ordinal))
                    return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { title = "not found" }));

                if (path.EndsWith("/v1/roi/executive-summary", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        totalEstimatedUsdSavings = 0,
                        systems = Array.Empty<object>(),
                        basisBreakdown = new { openFindingsEstimatedUsd = 0 },
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        ShipGateEvidenceRunner runner = new(http, alternateScopeClientFactory: () => CreateAlternateClient(handler));

        ShipGateEvidenceReport report = await runner.RunAsync(RunId);

        report.Gates.Should().Contain(g => g.GateNumber == 1 && g.Verdict == ShipGateEvidenceVerdict.Fail);
        report.AnyFail.Should().BeTrue();
    }

    [Fact]
    public async Task RunAsync_CrossTenantRunLeak_FailsGate6()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;
                string? tenant = req.Headers.TryGetValues(CliScopeHeaders.TenantHeader, out IEnumerable<string>? values)
                    ? values.FirstOrDefault()
                    : null;

                if (path.EndsWith($"/v1/architecture/run/{RunId}", StringComparison.Ordinal))
                {
                    if (string.Equals(tenant, AlternateTenantId, StringComparison.OrdinalIgnoreCase))
                    {
                        return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { run = new { runId = RunId } }));
                    }

                    return Task.FromResult(JsonResponse(
                        HttpStatusCode.OK,
                        BuildRunPayload(ArchitectureRunStatus.Committed, "v1.0.0", BuildCitationCompliantResults())));
                }

                if (TryHandleTenantIsolationRequest(req, out HttpResponseMessage? isolationResponse))
                    return Task.FromResult(isolationResponse!);

                if (TryHandleExportMatrixRequest(req, out HttpResponseMessage? exportResponse))
                    return Task.FromResult(exportResponse!);

                if (TryHandleFirstReviewCompletionRequest(req, out HttpResponseMessage? completionResponse))
                    return Task.FromResult(completionResponse!);

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new[]
                    {
                        new { artifactId = Guid.NewGuid().ToString("D") },
                    }));
                }

                if (path.EndsWith("/v1/roi/executive-summary", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        totalEstimatedUsdSavings = 1234.56m,
                        systems = new[] { new { systemName = "demo" } },
                        basisBreakdown = new { openFindingsEstimatedUsd = 50m },
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        ShipGateEvidenceRunner runner = new(http, alternateScopeClientFactory: () => CreateAlternateClient(handler));

        ShipGateEvidenceReport report = await runner.RunAsync(RunId);

        report.Gates.Should().Contain(g => g.GateNumber == 6 && g.Verdict == ShipGateEvidenceVerdict.Fail);
        report.AnyFail.Should().BeTrue();
    }

    [Fact]
    public async Task RunAsync_MissingDocxExport_FailsGate4()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                if (TryHandleTenantIsolationRequest(req, out HttpResponseMessage? isolationResponse))
                    return Task.FromResult(isolationResponse!);

                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/pilots/runs/{RunId}/first-value-report", StringComparison.Ordinal))
                {
                    return Task.FromResult(TextExportResponse(
                        HttpStatusCode.OK,
                        "# First value\n\nCommitted run summary.",
                        "text/markdown"));
                }

                if (path.EndsWith($"/v1/architecture/run/{RunId}/analysis-report/export/docx", StringComparison.Ordinal))
                {
                    return Task.FromResult(TextExportResponse(HttpStatusCode.NotFound, "missing", "application/json"));
                }

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}/export", StringComparison.Ordinal))
                {
                    return Task.FromResult(BytesExportResponse(
                        HttpStatusCode.OK,
                        [0x50, 0x4B, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00],
                        "application/zip"));
                }

                if (path.EndsWith($"/v1/architecture/run/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(
                        HttpStatusCode.OK,
                        BuildRunPayload(ArchitectureRunStatus.Committed, "v1.0.0", BuildCitationCompliantResults())));
                }

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new[]
                    {
                        new { artifactId = Guid.NewGuid().ToString("D") },
                    }));
                }

                if (path.EndsWith("/v1/roi/executive-summary", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        totalEstimatedUsdSavings = 1234.56m,
                        systems = new[] { new { systemName = "demo" } },
                        basisBreakdown = new { openFindingsEstimatedUsd = 50m },
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        ShipGateEvidenceRunner runner = new(http, alternateScopeClientFactory: () => CreateAlternateClient(handler));

        ShipGateEvidenceReport report = await runner.RunAsync(RunId);

        report.Gates.Should().Contain(g => g.GateNumber == 4 && g.Verdict == ShipGateEvidenceVerdict.Fail);
        report.AnyFail.Should().BeTrue();
    }

    [Fact]
    public async Task RunAsync_MissingProvenanceGraph_FailsGate1()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                if (TryHandleTenantIsolationRequest(req, out HttpResponseMessage? isolationResponse))
                    return Task.FromResult(isolationResponse!);

                if (TryHandleExportMatrixRequest(req, out HttpResponseMessage? exportResponse))
                    return Task.FromResult(exportResponse!);

                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/architecture/runs/{RunId}/provenance", StringComparison.Ordinal))
                    return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { title = "missing" }));

                if (path.EndsWith($"/v1/architecture/run/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(
                        HttpStatusCode.OK,
                        BuildRunPayload(ArchitectureRunStatus.Committed, "v1.0.0", BuildCitationCompliantResults())));
                }

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new[]
                    {
                        new { artifactId = Guid.NewGuid().ToString("D") },
                    }));
                }

                if (path.EndsWith("/v1/roi/executive-summary", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        totalEstimatedUsdSavings = 1234.56m,
                        systems = new[] { new { systemName = "demo" } },
                        basisBreakdown = new { openFindingsEstimatedUsd = 50m },
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        ShipGateEvidenceRunner runner = new(http, alternateScopeClientFactory: () => CreateAlternateClient(handler));

        ShipGateEvidenceReport report = await runner.RunAsync(RunId);

        report.Gates.Should().Contain(g => g.GateNumber == 1 && g.Verdict == ShipGateEvidenceVerdict.Fail);
        report.AnyFail.Should().BeTrue();
    }

    [Fact]
    public void ShipGateEvidenceOptions_Parse_RequiresRunId()
    {
        Action parse = () => ShipGateEvidenceOptions.Parse([]);

        parse.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ShipGateEvidenceOptions_Parse_ReadsOutputPaths()
    {
        ShipGateEvidenceOptions options = ShipGateEvidenceOptions.Parse(
            [
                "--run-id", RunId,
                "--json-out", "gate.json",
                "--markdown-out", "gate.md",
                "--ui-base-url", "http://localhost:3000",
                "--alternate-tenant-id", AlternateTenantId,
            ]);

        options.RunId.Should().Be(RunId);
        options.JsonOutPath.Should().Be("gate.json");
        options.MarkdownOutPath.Should().Be("gate.md");
        options.UiBaseUrl.Should().Be("http://localhost:3000");
        options.AlternateTenantId.Should().Be(AlternateTenantId);
    }

    private static bool TryHandleTenantIsolationRequest(HttpRequestMessage request, out HttpResponseMessage? response)
    {
        response = null;
        string path = request.RequestUri!.AbsolutePath;
        string? tenant = request.Headers.TryGetValues(CliScopeHeaders.TenantHeader, out IEnumerable<string>? values)
            ? values.FirstOrDefault()
            : null;

        if (!string.Equals(tenant, AlternateTenantId, StringComparison.OrdinalIgnoreCase))
            return false;

        if (path.StartsWith("/v1/runs", StringComparison.Ordinal))
        {
            response = JsonResponse(HttpStatusCode.OK, new
            {
                items = new[] { new { runId = "bbbbbbbb-2222-2222-2222-222222222222" } },
            });

            return true;
        }

        response = JsonResponse(HttpStatusCode.NotFound, new { title = "Not found" });

        return true;
    }

    private static bool TryHandleFirstReviewCompletionRequest(HttpRequestMessage request, out HttpResponseMessage? response)
    {
        response = null;
        string path = request.RequestUri!.AbsolutePath;

        if (!path.EndsWith($"/v1/architecture/runs/{RunId}/provenance", StringComparison.Ordinal))
            return false;

        response = JsonResponse(HttpStatusCode.OK, new
        {
            nodes = new[] { new { id = "run", type = "run" } },
            edges = Array.Empty<object>(),
        });

        return true;
    }

    private static bool TryHandleExportMatrixRequest(HttpRequestMessage request, out HttpResponseMessage? response)
    {
        response = null;
        string path = request.RequestUri!.AbsolutePath;

        if (path.EndsWith($"/v1/pilots/runs/{RunId}/first-value-report", StringComparison.Ordinal))
        {
            response = TextExportResponse(
                HttpStatusCode.OK,
                "# First value\n\nCommitted run summary.",
                "text/markdown");

            return true;
        }

        if (path.EndsWith($"/v1/architecture/run/{RunId}/analysis-report/export/docx", StringComparison.Ordinal))
        {
            response = BytesExportResponse(
                HttpStatusCode.OK,
                new byte[600],
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

            return true;
        }

        if (path.EndsWith($"/v1/artifacts/runs/{RunId}/export", StringComparison.Ordinal))
        {
            response = BytesExportResponse(
                HttpStatusCode.OK,
                [0x50, 0x4B, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00],
                "application/zip");

            return true;
        }

        return false;
    }

    private static HttpClient CreateAlternateClient(StubHandler handler)
    {
        HttpClient client = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        CliScopeHeaders.ApplyExplicit(client, AlternateTenantId, AlternateWorkspaceId, AlternateProjectId);

        return client;
    }

    private static HttpClient CreateClient(HttpMessageHandler handler)
    {
        HttpClient http = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return http;
    }

    private static object[] BuildCitationCompliantResults()
    {
        return
        [
            new AgentResult
            {
                ResultId = "result-compliance-1",
                AgentType = AgentType.Compliance,
                EvidenceRefs = ["evidence-1"],
                Citations = [new Citation { SourceId = "POL-1", Description = "Mapped control policy." }],
                Findings =
                [
                    new ArchitectureFinding
                    {
                        FindingId = "finding-1",
                        Category = "Compliance",
                        Severity = FindingSeverity.Warning,
                        EvidenceRefs = ["evidence-1"],
                    },
                ],
            },
        ];
    }

    private static object[] BuildCitationFailingResults()
    {
        return
        [
            new AgentResult
            {
                ResultId = "result-compliance-1",
                AgentType = AgentType.Compliance,
                Findings =
                [
                    new ArchitectureFinding
                    {
                        FindingId = "finding-1",
                        Category = "Compliance",
                        Severity = FindingSeverity.Warning,
                    },
                ],
            },
        ];
    }

    private static string BuildRunPayload(ArchitectureRunStatus status, string manifestVersion, object[] results)
    {
        object payload = new
        {
            run = new
            {
                runId = RunId,
                requestId = "22222222-2222-2222-2222-222222222222",
                status = (int)status,
                createdUtc = DateTime.UtcNow,
                completedUtc = DateTime.UtcNow,
                currentManifestVersion = manifestVersion,
                structuralExecutionMode = 1,
            },
            tasks = Array.Empty<object>(),
            results,
        };

        return JsonSerializer.Serialize(payload);
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode status, object body)
    {
        string json = body as string ?? JsonSerializer.Serialize(body);

        return new HttpResponseMessage(status)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json"),
        };
    }

    private static HttpResponseMessage TextExportResponse(HttpStatusCode status, string body, string contentType) =>
        new(status)
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, contentType),
        };

    private static HttpResponseMessage BytesExportResponse(HttpStatusCode status, byte[] body, string contentType) =>
        new(status)
        {
            Content = new ByteArrayContent(body)
            {
                Headers = { ContentType = new MediaTypeHeaderValue(contentType) },
            },
        };

    private sealed class StubHandler : HttpMessageHandler
    {
        public required Func<HttpRequestMessage, Task<HttpResponseMessage>> OnRequest
        {
            get;
            init;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return OnRequest(request);
        }
    }
}
