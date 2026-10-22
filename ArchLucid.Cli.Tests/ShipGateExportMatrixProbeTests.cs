using System.Net;
using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ShipGateExportMatrixProbeTests
{
    private const string RunId = "11111111-1111-1111-1111-111111111111";
    private const string BaseUrl = "https://pilot.archlucid.test";

    [Fact]
    public async Task ProbeAsync_AllFormatsReturn200_PassesEveryProbe()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/pilots/runs/{RunId}/first-value-report", StringComparison.Ordinal))
                {
                    return Task.FromResult(TextResponse(HttpStatusCode.OK, "# First value\n\nCommitted run summary.", "text/markdown"));
                }

                if (path.EndsWith($"/v1/architecture/review/{RunId}/analysis-report/export/docx", StringComparison.Ordinal))
                {
                    return Task.FromResult(BytesResponse(
                        HttpStatusCode.OK,
                        new byte[600],
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
                }

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}/export", StringComparison.Ordinal))
                {
                    return Task.FromResult(BytesResponse(
                        HttpStatusCode.OK,
                        ShipGateExportMatrixTestFixtures.ZipStubBody(),
                        "application/zip"));
                }

                if (path.EndsWith($"/v1/architecture/review/{RunId}/traceability-bundle.zip", StringComparison.Ordinal))
                {
                    return Task.FromResult(BytesResponse(
                        HttpStatusCode.OK,
                        ShipGateExportMatrixTestFixtures.ZipStubBody(),
                        "application/zip"));
                }

                return Task.FromResult(TextResponse(HttpStatusCode.NotFound, "missing", "application/json"));
            },
        };

        using HttpClient http = CreateClient(handler);
        ShipGateExportMatrixContract contract = ShipGateExportMatrixContractLoader.Load(null);

        IReadOnlyList<ShipGateExportMatrixProbeResult> results =
            await ShipGateExportMatrixProbe.ProbeAsync(http, RunId, contract);

        results.Should().OnlyContain(static result => result.Success);
        results.Should().HaveCount(contract.Probes.Count);
    }

    [Fact]
    public async Task ProbeAsync_MissingZipMagicBytes_FailsZipProbe()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith($"/v1/pilots/runs/{RunId}/first-value-report", StringComparison.Ordinal))
                {
                    return Task.FromResult(TextResponse(HttpStatusCode.OK, "# First value\n\nCommitted run summary.", "text/markdown"));
                }

                if (path.EndsWith($"/v1/architecture/review/{RunId}/analysis-report/export/docx", StringComparison.Ordinal))
                {
                    return Task.FromResult(BytesResponse(
                        HttpStatusCode.OK,
                        new byte[600],
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
                }

                if (path.EndsWith($"/v1/artifacts/runs/{RunId}/export", StringComparison.Ordinal))
                {
                    return Task.FromResult(BytesResponse(HttpStatusCode.OK, new byte[128], "application/zip"));
                }

                if (path.EndsWith($"/v1/architecture/review/{RunId}/traceability-bundle.zip", StringComparison.Ordinal))
                {
                    return Task.FromResult(BytesResponse(
                        HttpStatusCode.OK,
                        ShipGateExportMatrixTestFixtures.ZipStubBody(),
                        "application/zip"));
                }

                return Task.FromResult(TextResponse(HttpStatusCode.NotFound, "missing", "application/json"));
            },
        };

        using HttpClient http = CreateClient(handler);
        ShipGateExportMatrixContract contract = ShipGateExportMatrixContractLoader.Load(null);

        IReadOnlyList<ShipGateExportMatrixProbeResult> results =
            await ShipGateExportMatrixProbe.ProbeAsync(http, RunId, contract);

        results.Should().Contain(result => result.Format == "zip" && !result.Success);
    }

    [Fact]
    public void ResolvePath_EscapesRunId()
    {
        string resolved = ShipGateExportMatrixProbe.ResolvePath("/v1/pilots/runs/{runId}/first-value-report", RunId);

        resolved.Should().Be($"/v1/pilots/runs/{RunId}/first-value-report");
    }

    private static HttpClient CreateClient(HttpMessageHandler handler)
    {
        HttpClient http = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return http;
    }

    private static HttpResponseMessage TextResponse(HttpStatusCode status, string body, string contentType) =>
        new(status)
        {
            Content = new StringContent(body, Encoding.UTF8, contentType),
        };

    private static HttpResponseMessage BytesResponse(HttpStatusCode status, byte[] body, string contentType) =>
        new(status)
        {
            Content = new ByteArrayContent(body)
            {
                Headers = { ContentType = new MediaTypeHeaderValue(contentType) },
            },
        };

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
