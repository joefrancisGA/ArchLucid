using System.Net;
using System.Text;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>Unit coverage for <see cref="JourneyHttpExecutor"/> transport and validation branches.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class JourneyHttpExecutorTests
{
    [Fact]
    public async Task SendJsonAsync_without_schema_returns_success_on_200()
    {
        using DelegatingTestHttpHandler handler = new((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{}", Encoding.UTF8, "application/json"),
                Headers = { { "X-Correlation-ID", "corr-json" } }
            }));

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://harness.test/") };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyHttpExecutor executor = new(http, new ResponseValidationPipeline(catalog));

        TimedHttpResult result = await executor.SendJsonAsync(
            "health",
            HttpMethod.Get,
            "health/ready",
            content: null,
            schemaName: null,
            dtoType: null,
            extraHeaders: null,
            CancellationToken.None);

        result.Step.Passed.Should().BeTrue();
        result.CorrelationId.Should().Be("corr-json");
    }

    [Fact]
    public async Task SendJsonAsync_returns_failure_on_transport_error()
    {
        using DelegatingTestHttpHandler handler = new((_, _) =>
            throw new HttpRequestException("network down"));

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://harness.test/") };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyHttpExecutor executor = new(http, new ResponseValidationPipeline(catalog));

        TimedHttpResult result = await executor.SendJsonAsync(
            "transport",
            HttpMethod.Get,
            "v1/ping",
            null,
            null,
            null,
            null,
            CancellationToken.None);

        result.Step.Passed.Should().BeFalse();
        result.Step.Detail.Should().Contain("Transport error");
    }

    [Fact]
    public async Task SendJsonAsync_returns_failure_on_non_success_status()
    {
        using DelegatingTestHttpHandler handler = new((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent("{\"detail\":\"bad\"}", Encoding.UTF8, "application/json")
            }));

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://harness.test/") };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyHttpExecutor executor = new(http, new ResponseValidationPipeline(catalog));

        TimedHttpResult result = await executor.SendJsonAsync(
            "bad",
            HttpMethod.Post,
            "v1/architecture/request",
            JourneyHttpExecutor.JsonContent("{}"),
            null,
            null,
            null,
            CancellationToken.None);

        result.Step.Passed.Should().BeFalse();
        result.Step.Detail.Should().Contain("HTTP 400");
        result.Step.FailureHint.Should().Contain("Problem+JSON");
    }

    [Fact]
    public async Task SendJsonAsync_returns_failure_on_invalid_json_when_schema_requested()
    {
        using DelegatingTestHttpHandler handler = new((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("not-json", Encoding.UTF8, "application/json")
            }));

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://harness.test/") };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyHttpExecutor executor = new(http, new ResponseValidationPipeline(catalog));

        TimedHttpResult result = await executor.SendJsonAsync(
            "invalid-json",
            HttpMethod.Get,
            "v1/architecture/review/run-1",
            null,
            "RunDetailDto",
            typeof(ArchLucid.Api.Client.Generated.RunDetailDto),
            null,
            CancellationToken.None);

        result.Step.Passed.Should().BeFalse();
        result.Step.Detail.Should().Contain("not valid JSON");
    }

    [Fact]
    public async Task SendJsonAsync_applies_extra_headers()
    {
        HttpRequestMessage? captured = null;

        using DelegatingTestHttpHandler handler = new((request, _) =>
        {
            captured = request;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{}", Encoding.UTF8, "application/json")
            });
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://harness.test/") };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyHttpExecutor executor = new(http, new ResponseValidationPipeline(catalog));

        await executor.SendJsonAsync(
            "headers",
            HttpMethod.Post,
            "v1/governance/approval-requests",
            JourneyHttpExecutor.JsonContent("{}"),
            null,
            null,
            HarnessActorHeaders.Create("Actor", "actor-1"),
            CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.Headers.GetValues(HarnessActorHeaders.ActorNameHeader).Should().ContainSingle("Actor");
    }

    [Fact]
    public async Task SendBinaryAsync_returns_success_with_bytes()
    {
        byte[] payload = [0x50, 0x4b, 0x03, 0x04];

        using DelegatingTestHttpHandler handler = new((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(payload)
                {
                    Headers = { ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/zip") }
                }
            }));

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://harness.test/") };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyHttpExecutor executor = new(http, new ResponseValidationPipeline(catalog));

        TimedHttpResult result = await executor.SendBinaryAsync(
            "export",
            HttpMethod.Get,
            "v1/artifacts/runs/run-1/export",
            CancellationToken.None);

        result.Step.Passed.Should().BeTrue();
        result.Step.Detail.Should().Contain("4 bytes");
    }

    [Fact]
    public async Task SendBinaryAsync_fails_on_empty_body()
    {
        using DelegatingTestHttpHandler handler = new((_, _) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(Array.Empty<byte>())
            }));

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://harness.test/") };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyHttpExecutor executor = new(http, new ResponseValidationPipeline(catalog));

        TimedHttpResult result = await executor.SendBinaryAsync(
            "empty-export",
            HttpMethod.Get,
            "v1/artifacts/runs/run-1/export",
            CancellationToken.None);

        result.Step.Passed.Should().BeFalse();
        result.Step.Detail.Should().Contain("body was empty");
    }
}
