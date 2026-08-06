using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RealModeSmokeRunnerTests
{
    private const string BaseUrl = "https://staging.archlucid.test";
    private const string RunId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    private static readonly JsonSerializerOptions JsonCamel = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [Fact]
    public async Task RunAsync_HappyPath_PassesAllStepsAndRequiresRealTokensOnStaging()
    {
        int pollCount = 0;
        StubHandler handler = new();
        handler.OnRequest = req =>
        {
            string path = req.RequestUri!.AbsolutePath;

            if (req.Method == HttpMethod.Get && path == "/health/live")
                return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { status = "live" }));

            if (req.Method == HttpMethod.Get && path == "/health/ready")
                return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { status = "ready" }));

            if (req.Method == HttpMethod.Post && path == "/v1/architecture/request")
                return Task.FromResult(JsonResponse(HttpStatusCode.Created, new { run = new { runId = RunId } }));

            if (req.Method == HttpMethod.Post && path == $"/v1/architecture/review/{RunId}/execute")
            {
                req.Headers.GetValues(PilotTryRealModeHeaders.PilotTryRealMode).Should().ContainSingle("1");

                return Task.FromResult(JsonResponse(HttpStatusCode.Accepted, new { }));
            }

            if (req.Method == HttpMethod.Get && path == $"/v1/architecture/review/{RunId}")
            {
                pollCount++;

                if (pollCount < 2)
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        run = new { runId = RunId, status = "Running" },
                        results = Array.Empty<object>(),
                        agentExecutionLlmCostEstimate = new
                        {
                            tokenCounts = new { prompt = 0L, completion = 0L }
                        }
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                {
                    run = new { runId = RunId, status = "ReadyForCommit" },
                    results = new[] { new { agentType = "Topology" } },
                    agentExecutionLlmCostEstimate = new
                    {
                        tokenCounts = new { prompt = 100L, completion = 25L }
                    }
                }));
            }

            return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
        };

        RealModeSmokeReport report = await RunAsync(handler, new RealModeSmokeCommandOptions
        {
            TargetStaging = true,
            RequireRealExecutionTokens = true,
            PollIntervalSeconds = 1,
            TimeoutSeconds = 30
        });

        report.AllPassed.Should().BeTrue();
        report.RunId.Should().Be(RunId);
        report.FinalRunStatus.Should().Be("ReadyForCommit");
        report.TotalLlmTokens.Should().Be(125);
        report.Steps.Select(s => s.Name).Should().ContainInOrder(
            "health-live",
            "health-ready",
            "create-run",
            "execute-run",
            "poll-ready",
            "verify-real-execution");
    }

    [Fact]
    public async Task RunAsync_ZeroTokensOnStaging_FailsVerifyRealExecution()
    {
        StubHandler handler = new();
        handler.OnRequest = req =>
        {
            string path = req.RequestUri!.AbsolutePath;

            if (req.Method == HttpMethod.Get && (path == "/health/live" || path == "/health/ready"))
                return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { }));

            if (req.Method == HttpMethod.Post && path == "/v1/architecture/request")
                return Task.FromResult(JsonResponse(HttpStatusCode.Created, new { run = new { runId = RunId } }));

            if (req.Method == HttpMethod.Post && path == $"/v1/architecture/review/{RunId}/execute")
                return Task.FromResult(JsonResponse(HttpStatusCode.Accepted, new { }));

            if (req.Method == HttpMethod.Get && path == $"/v1/architecture/review/{RunId}")
            {
                return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                {
                    run = new { runId = RunId, status = "ReadyForCommit" },
                    results = new[] { new { agentType = "Topology" } },
                    agentExecutionLlmCostEstimate = new
                    {
                        tokenCounts = new { prompt = 0L, completion = 0L }
                    }
                }));
            }

            return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
        };

        RealModeSmokeReport report = await RunAsync(handler, new RealModeSmokeCommandOptions
        {
            RequireRealExecutionTokens = true,
            PollIntervalSeconds = 1,
            TimeoutSeconds = 30
        });

        report.AllPassed.Should().BeFalse();
        report.Steps.Last().Name.Should().Be("verify-real-execution");
        report.Steps.Last().Passed.Should().BeFalse();
    }

    private static async Task<RealModeSmokeReport> RunAsync(StubHandler handler, RealModeSmokeCommandOptions options)
    {
        HttpClient http = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        RealModeSmokeRunner runner = new(http);

        return await runner.RunAsync(options);
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode status, object body)
    {
        HttpResponseMessage response = new(status)
        {
            Content = JsonContent.Create(body, options: JsonCamel)
        };

        response.Headers.TryAddWithoutValidation("X-Correlation-ID", "corr-smoke-test");

        return response;
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        public Func<HttpRequestMessage, Task<HttpResponseMessage>>? OnRequest { get; set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            if (OnRequest is null)
                throw new InvalidOperationException("OnRequest not configured.");

            return OnRequest(request);
        }
    }
}
