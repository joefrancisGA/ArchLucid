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
    public void DeriveOverallVerdict_LiveModeDowngradesPassWhenCrossTenantProbeSkipped()
    {
        List<TenantIsolationNegativeTestProbeResult> probes =
        [
            new() { Name = "primary-scope-run-visible", Verdict = TenantIsolationNegativeTestVerdict.Pass },
            new() { Name = "cross-tenant-run-get", Verdict = TenantIsolationNegativeTestVerdict.Skip },
        ];

        TenantIsolationNegativeTestAggregator.DeriveOverallVerdict(probes, liveApiMode: true)
            .Should()
            .Be(TenantIsolationNegativeTestVerdict.Skip);
    }

    [Fact]
    public void DeriveOverallVerdict_OfflineModeAllowsPassWhenCrossTenantProbeSkipped()
    {
        List<TenantIsolationNegativeTestProbeResult> probes =
        [
            new() { Name = "offline-scenario:cross-tenant-run-list", Verdict = TenantIsolationNegativeTestVerdict.Skip },
            new() { Name = "offline-scenario:cross-tenant-run-get", Verdict = TenantIsolationNegativeTestVerdict.Pass },
        ];

        TenantIsolationNegativeTestAggregator.DeriveOverallVerdict(probes, liveApiMode: false)
            .Should()
            .Be(TenantIsolationNegativeTestVerdict.Pass);
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

    [Fact]
    public async Task RunLiveAsync_SkipsCrossTenantRunListProbeOnServerError()
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
                        return Task.FromResult(JsonResponse(HttpStatusCode.InternalServerError, new { title = "Server error" }));

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

        report.Probes.Should().Contain(probe =>
            probe.Name == "cross-tenant-run-list" && probe.Verdict == TenantIsolationNegativeTestVerdict.Skip);
        report.OverallVerdict.Should().Be(TenantIsolationNegativeTestVerdict.Skip);
    }

    [Fact]
    public async Task RunLiveAsync_WithAllCrossTenantServerErrors_ReportsOverallSkip()
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
                    return Task.FromResult(JsonResponse(HttpStatusCode.InternalServerError, new { title = "Server error" }));

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

        report.OverallVerdict.Should().Be(TenantIsolationNegativeTestVerdict.Skip);
        report.Probes.Should().OnlyContain(probe =>
            probe.Verdict == TenantIsolationNegativeTestVerdict.Pass
            || probe.Verdict == TenantIsolationNegativeTestVerdict.Skip);
        report.Probes.Should().Contain(probe =>
            probe.Name == "primary-scope-run-visible" && probe.Verdict == TenantIsolationNegativeTestVerdict.Pass);
        report.Probes.Should().Contain(probe =>
            probe.Verdict == TenantIsolationNegativeTestVerdict.Skip && probe.Name != "primary-scope-run-visible");
    }

    [Fact]
    public void RunOffline_SkipsExcludeRunIdProbeOnServerError()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string manifestPath = Path.Combine(Path.GetTempPath(), $"tenant-isolation-manifest-{Guid.NewGuid():N}.json");
        string manifestJson = """
                              {
                                "schemaVersion": 1,
                                "primaryRunId": "aaaaaaaa-1111-1111-1111-111111111111",
                                "scenarios": [
                                  {
                                    "name": "list-server-error",
                                    "probes": [
                                      {
                                        "name": "cross-tenant-run-list",
                                        "path": "/v1/runs?limit=200",
                                        "expectedOutcome": "exclude-run-id",
                                        "observedOutcome": "HTTP 503",
                                        "observedStatusCode": 503,
                                        "evidence": "run list unavailable",
                                        "foreignRunIdVisible": false,
                                        "verdict": "pass"
                                      }
                                    ]
                                  }
                                ]
                              }
                              """;

        File.WriteAllText(manifestPath, manifestJson);

        try
        {
            TenantIsolationNegativeTestRunner runner = new();
            TenantIsolationNegativeTestReport report = runner.RunOffline(
                repositoryRoot!,
                new TenantIsolationNegativeTestOptions { ManifestPath = manifestPath });

            report.Probes.Should().ContainSingle();
            report.Probes[0].Verdict.Should().Be(TenantIsolationNegativeTestVerdict.Skip);
        }
        finally
        {
            File.Delete(manifestPath);
        }
    }

    [Fact]
    public void RunOffline_IgnoresManifestPassVerdictWhenObservedStatusIsUnexpectedSuccess()
    {
        string? repositoryRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        repositoryRoot.Should().NotBeNull();

        string manifestPath = Path.Combine(Path.GetTempPath(), $"tenant-isolation-manifest-{Guid.NewGuid():N}.json");
        string manifestJson = """
                              {
                                "schemaVersion": 1,
                                "primaryRunId": "aaaaaaaa-1111-1111-1111-111111111111",
                                "scenarios": [
                                  {
                                    "name": "manifest-lies",
                                    "probes": [
                                      {
                                        "name": "cross-tenant-run-get",
                                        "path": "/v1/architecture/review/aaaaaaaa-1111-1111-1111-111111111111",
                                        "expectedOutcome": "deny-status",
                                        "observedOutcome": "HTTP 200",
                                        "observedStatusCode": 200,
                                        "evidence": "manifest claims pass on unexpected 200",
                                        "verdict": "pass"
                                      }
                                    ]
                                  }
                                ]
                              }
                              """;

        File.WriteAllText(manifestPath, manifestJson);

        try
        {
            TenantIsolationNegativeTestRunner runner = new();
            TenantIsolationNegativeTestReport report = runner.RunOffline(
                repositoryRoot!,
                new TenantIsolationNegativeTestOptions { ManifestPath = manifestPath });

            report.Probes.Should().ContainSingle();
            report.Probes[0].Verdict.Should().Be(TenantIsolationNegativeTestVerdict.Fail);
            report.OverallVerdict.Should().Be(TenantIsolationNegativeTestVerdict.Fail);
        }
        finally
        {
            File.Delete(manifestPath);
        }
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
