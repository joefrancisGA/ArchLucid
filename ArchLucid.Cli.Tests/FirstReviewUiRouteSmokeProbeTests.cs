using System.Net;
using System.Net.Http.Headers;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FirstReviewUiRouteSmokeProbeTests
{
    private const string RunId = "11111111-1111-1111-1111-111111111111";
    private const string UiBaseUrl = "https://ui.archlucid.test";

    [Fact]
    public async Task ProbeAsync_AllRoutesReturn200_PassesEveryRoute()
    {
        HashSet<string> expectedPaths =
        [
            "/",
            "/reviews/new",
            $"/reviews/{RunId}",
            $"/reviews/{RunId}/sealed-record",
            "/signed-records",
            "/help/first-review",
        ];

        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (expectedPaths.Contains(path))
                {
                    return Task.FromResult(HtmlResponse(HttpStatusCode.OK, "<html><body>Operator home</body></html>"));
                }

                return Task.FromResult(HtmlResponse(HttpStatusCode.NotFound, "missing"));
            },
        };

        using HttpClient uiHttp = CreateClient(handler);
        FirstReviewUiRouteSmokeContract contract = FirstReviewUiRouteSmokeContractLoader.Load(null);

        IReadOnlyList<FirstReviewUiRouteSmokeProbeResult> results =
            await FirstReviewUiRouteSmokeProbe.ProbeAsync(uiHttp, RunId, contract);

        results.Should().OnlyContain(static result => result.Success);
        results.Should().HaveCount(contract.Routes.Count);
    }

    [Fact]
    public async Task ProbeAsync_ErrorBoundaryMarker_FailsRoute()
    {
        StubHandler handler = new()
        {
            OnRequest = _ => Task.FromResult(
                HtmlResponse(HttpStatusCode.OK, "<html><body>Something went wrong</body></html>")),
        };

        using HttpClient uiHttp = CreateClient(handler);
        FirstReviewUiRouteSmokeContract contract = FirstReviewUiRouteSmokeContractLoader.Load(null);

        IReadOnlyList<FirstReviewUiRouteSmokeProbeResult> results =
            await FirstReviewUiRouteSmokeProbe.ProbeAsync(uiHttp, RunId, contract);

        results.Should().Contain(static result => !result.Success);
    }

    [Fact]
    public void ResolvePath_EscapesRunId()
    {
        string resolved = FirstReviewUiRouteSmokeProbe.ResolvePath("/reviews/{runId}/sealed-record", RunId);

        resolved.Should().Be($"/reviews/{RunId}/sealed-record");
    }

    private static HttpClient CreateClient(HttpMessageHandler handler)
    {
        HttpClient http = new(handler) { BaseAddress = new Uri(UiBaseUrl + "/") };
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("text/html"));

        return http;
    }

    private static HttpResponseMessage HtmlResponse(HttpStatusCode status, string body)
    {
        return new HttpResponseMessage(status)
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, "text/html"),
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
