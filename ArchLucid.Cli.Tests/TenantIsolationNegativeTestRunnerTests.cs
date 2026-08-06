using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantIsolationNegativeTestRunnerTests
{
    private const string BaseUrl = "https://pilot.archlucid.test";
    private const string RunId = "aaaaaaaa-1111-1111-1111-111111111111";

    [Fact]
    public void EvaluateDenyStatus_Treats404And403AsPass()
    {
        TenantIsolationNegativeTestAggregator.EvaluateDenyStatus(404).Should().Be(TenantIsolationNegativeTestVerdict.Pass);
        TenantIsolationNegativeTestAggregator.EvaluateDenyStatus(403).Should().Be(TenantIsolationNegativeTestVerdict.Pass);
        TenantIsolationNegativeTestAggregator.EvaluateDenyStatus(200).Should().Be(TenantIsolationNegativeTestVerdict.Fail);
    }

    [Fact]
    public void DeriveOverallVerdict_FailsWhenAnyProbeFails()
    {
        List<TenantIsolationNegativeTestProbeResult> probes =
        [
            new() { Verdict = TenantIsolationNegativeTestVerdict.Pass },
            new() { Verdict = TenantIsolationNegativeTestVerdict.Fail },
        ];

        TenantIsolationNegativeTestAggregator.DeriveOverallVerdict(probes)
            .Should()
            .Be(TenantIsolationNegativeTestVerdict.Fail);
    }

    [Fact]
    public void TryFindRunIdInRunList_DetectsForeignRunId()
    {
        string json = """
                      {
                        "items": [
                          { "runId": "bbbbbbbb-2222-2222-2222-222222222222" },
                          { "runId": "aaaaaaaa-1111-1111-1111-111111111111" }
                        ]
                      }
                      """;

        TenantIsolationNegativeTestAggregator.TryFindRunIdInRunList(json, RunId).Should().BeTrue();
        TenantIsolationNegativeTestAggregator.TryFindRunIdInRunList(json, "missing-run").Should().BeFalse();
    }

    [Fact]
    public void RunOffline_WithFixtures_ReportsPassAndFailScenarios()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        TenantIsolationNegativeTestRunner runner = new();
        TenantIsolationNegativeTestReport report = runner.RunOffline(
            repositoryRoot!,
            new TenantIsolationNegativeTestOptions());

        report.LiveApiMode.Should().BeFalse();
        report.Probes.Should().Contain(probe => probe.Verdict == TenantIsolationNegativeTestVerdict.Pass);
        report.Probes.Should().Contain(probe => probe.Verdict == TenantIsolationNegativeTestVerdict.Fail);
        report.OverallVerdict.Should().Be(TenantIsolationNegativeTestVerdict.Fail);
        report.UnexpectedSuccessCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task RunLiveAsync_WithStubbedDenyResponses_PassesCrossTenantProbes()
    {
        StubHandler handler = new()
        {
            OnRequest = req =>
            {
                string path = req.RequestUri!.AbsolutePath;
                string? tenant = req.Headers.TryGetValues("X-Tenant-Id", out IEnumerable<string>? values)
                    ? values.FirstOrDefault()
                    : null;

                if (string.Equals(tenant, "44444444-4444-4444-4444-444444444444", StringComparison.OrdinalIgnoreCase))
                {
                    if (path.StartsWith("/v1/runs", StringComparison.Ordinal))
                    {
                        return Task.FromResult(JsonResponse(HttpStatusCode.OK, new
                        {
                            items = new[] { new { runId = "bbbbbbbb-2222-2222-2222-222222222222" } },
                        }));
                    }

                    return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { title = "Not found" }));
                }

                if (path.EndsWith($"/v1/architecture/review/{RunId}", StringComparison.Ordinal))
                    return Task.FromResult(JsonResponse(HttpStatusCode.OK, new { run = new { runId = RunId } }));

                return Task.FromResult(JsonResponse(HttpStatusCode.NotFound, new { }));
            },
        };

        using HttpClient primaryClient = CreateClient(handler);
        using HttpClient alternateClient = CreateClient(handler);
        CliScopeHeaders.ApplyExplicit(
            alternateClient,
            "44444444-4444-4444-4444-444444444444",
            "55555555-5555-5555-5555-555555555555",
            "66666666-6666-6666-6666-666666666666");

        TenantIsolationNegativeTestRunner runner = new();
        TenantIsolationNegativeTestReport report = await runner.RunLiveAsync(
            Directory.GetCurrentDirectory(),
            primaryClient,
            alternateClient,
            new TenantIsolationNegativeTestOptions { RunId = RunId });

        report.OverallVerdict.Should().Be(TenantIsolationNegativeTestVerdict.Pass);
        report.Probes.Should().OnlyContain(probe => probe.Verdict != TenantIsolationNegativeTestVerdict.Fail);
        report.Probes.Should().Contain(probe => probe.Name == "cross-tenant-run-get" && probe.Verdict == TenantIsolationNegativeTestVerdict.Pass);
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        public required Func<HttpRequestMessage, Task<HttpResponseMessage>> OnRequest { get; init; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return OnRequest(request);
        }
    }

    private static HttpClient CreateClient(StubHandler handler)
    {
        HttpClient client = new(handler) { BaseAddress = new Uri(BaseUrl + "/") };
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        CliScopeHeaders.ApplyExplicit(
            client,
            "11111111-1111-1111-1111-111111111111",
            "22222222-2222-2222-2222-222222222222",
            "33333333-3333-3333-3333-333333333333");

        return client;
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode statusCode, object payload)
    {
        HttpResponseMessage response = new(statusCode)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload)),
        };

        response.Headers.TryAddWithoutValidation("X-Correlation-ID", Guid.NewGuid().ToString("D"));

        return response;
    }
}
