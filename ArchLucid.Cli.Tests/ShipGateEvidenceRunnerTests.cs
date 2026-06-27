using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ShipGateEvidenceRunnerTests
{
    private const string BaseUrl = "https://pilot.archlucid.test";
    private const string RunId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public async Task RunAsync_CommittedRunAndExportProbes_PassesGates1_3_4()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/architecture/run/{RunId}", StringComparison.Ordinal))
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, BuildRunPayload(ArchitectureRunStatus.Committed, "v1.0.0", 2)));

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}", StringComparison.Ordinal))
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new[]
                    {
                        new { artifactId = Guid.NewGuid().ToString("D") },
                    }));

                if (path.EndsWith("/v1/roi/executive-summary", StringComparison.Ordinal))
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        totalEstimatedUsdSavings = 1234.56m,
                        systems = new[] { new { systemName = "demo" } },
                        basisBreakdown = new { openFindingsEstimatedUsd = 50m },
                    }));

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}/export", StringComparison.Ordinal)
                    || path.EndsWith($"/v1/architecture/run/{RunId}/traceability-bundle.zip", StringComparison.Ordinal))
                {
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new ByteArrayContent([1, 2, 3])
                    });
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            }
        };

        using HttpClient http = CreateClient(handler);
        ShipGateEvidenceRunner runner = new(http);

        ShipGateEvidenceReport report = await runner.RunAsync(RunId);

        report.Gates.Should().Contain(g => g.GateNumber == 1 && g.Verdict == ShipGateEvidenceVerdict.Pass);
        report.Gates.Should().Contain(g => g.GateNumber == 3 && g.Verdict == ShipGateEvidenceVerdict.Pass);
        report.Gates.Should().Contain(g => g.GateNumber == 4 && g.Verdict == ShipGateEvidenceVerdict.Pass);
        report.Gates.Should().Contain(g => g.GateNumber == 2 && g.Verdict == ShipGateEvidenceVerdict.Unknown);
        report.Gates.Should().Contain(g => g.GateNumber == 5 && g.Verdict == ShipGateEvidenceVerdict.Unknown);
        report.Gates.Should().Contain(g => g.GateNumber == 6 && g.Verdict == ShipGateEvidenceVerdict.Pass);
    }

    [Fact]
    public async Task RunAsync_MissingRun_FailsGate1()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/architecture/run/{RunId}", StringComparison.Ordinal))
                    return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { title = "not found" }));

                if (path.EndsWith("/v1/roi/executive-summary", StringComparison.Ordinal))
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        totalEstimatedUsdSavings = 0,
                        systems = Array.Empty<object>(),
                        basisBreakdown = new { openFindingsEstimatedUsd = 0 },
                    }));

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            }
        };

        using HttpClient http = CreateClient(handler);
        ShipGateEvidenceRunner runner = new(http);

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
            ["--run-id", RunId, "--json-out", "gate.json", "--markdown-out", "gate.md"]);

        options.RunId.Should().Be(RunId);
        options.JsonOutPath.Should().Be("gate.json");
        options.MarkdownOutPath.Should().Be("gate.md");
    }

    private static HttpClient CreateClient(HttpMessageHandler handler)
    {
        HttpClient http = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return http;
    }

    private static string BuildRunPayload(ArchitectureRunStatus status, string manifestVersion, int resultCount)
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
                structuralExecutionMode = 1
            },
            tasks = Array.Empty<object>(),
            results = Enumerable.Range(0, resultCount).Select(i => new { id = i }).ToArray()
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
