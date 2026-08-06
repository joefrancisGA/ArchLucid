using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FirstReviewCompletionProbeTests
{
    private const string RunId = "11111111-1111-1111-1111-111111111111";
    private const string RequestId = "22222222-2222-2222-2222-222222222222";
    private const string BaseUrl = "https://pilot.archlucid.test";

    [Fact]
    public async Task EvaluateAsync_CommittedRunWithProvenance_PassesAllSignals()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new[]
                    {
                        new { artifactId = Guid.NewGuid().ToString("D") },
                    }));
                }

                if (path.EndsWith($"/v1/architecture/reviews/{RunId}/provenance", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                    {
                        nodes = new[] { new { id = "run", type = "run" } },
                        edges = Array.Empty<object>(),
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient http = CreateClient(handler);
        FirstReviewCompletionContract contract = FirstReviewCompletionContractLoader.Load(null);
        FirstReviewCompletionRunSnapshot snapshot = BuildSnapshot();

        IReadOnlyList<FirstReviewCompletionProbeResult> results =
            await FirstReviewCompletionProbe.EvaluateAsync(http, RunId, snapshot, contract);

        results.Should().OnlyContain(static result => result.Success);
    }

    [Fact]
    public async Task EvaluateAsync_MissingProvenanceGraph_FailsProvenanceSignal()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}", StringComparison.Ordinal))
                {
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new[]
                    {
                        new { artifactId = Guid.NewGuid().ToString("D") },
                    }));
                }

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { title = "missing" }));
            },
        };

        using HttpClient http = CreateClient(handler);
        FirstReviewCompletionContract contract = FirstReviewCompletionContractLoader.Load(null);
        FirstReviewCompletionRunSnapshot snapshot = BuildSnapshot();

        IReadOnlyList<FirstReviewCompletionProbeResult> results =
            await FirstReviewCompletionProbe.EvaluateAsync(http, RunId, snapshot, contract);

        results.Should().Contain(result => result.SignalId == "provenance-graph" && !result.Success);
    }

    [Fact]
    public async Task EvaluateAsync_NullSnapshot_FailsRunDetailSignal()
    {
        using HttpClient http = CreateClient(new StubHandler
        {
            OnRequest = _ => Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { })),
        });

        FirstReviewCompletionContract contract = FirstReviewCompletionContractLoader.Load(null);

        IReadOnlyList<FirstReviewCompletionProbeResult> results =
            await FirstReviewCompletionProbe.EvaluateAsync(http, RunId, null, contract);

        results.Should().ContainSingle(result => !result.Success && result.SignalId == "run-detail");
    }

    private static FirstReviewCompletionRunSnapshot BuildSnapshot() =>
        new()
        {
            StatusRaw = "Committed",
            CurrentManifestVersion = "v1.0.0",
            RequestId = RequestId,
            HasCompletedUtc = true,
            TaskCount = 1,
            ResultCount = 1,
        };

    private static HttpClient CreateClient(HttpMessageHandler handler)
    {
        HttpClient http = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return http;
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode status, object body)
    {
        string json = JsonSerializer.Serialize(body);

        return new HttpResponseMessage(status)
        {
            Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json"),
        };
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        public required Func<HttpRequestMessage, Task<HttpResponseMessage>> OnRequest { get; init; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return OnRequest(request);
        }
    }
}
