using System.Net;
using System.Text;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>Early-exit and poll failure branches in <see cref="OperatorReviewJourneyRunner"/>.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperatorReviewJourneyRunnerFailurePathTests
{
    [Fact]
    public async Task Runner_fails_when_create_response_omits_runId()
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
                return Json(HttpStatusCode.Created, """{"run":{"status":"Created"}}""");
            }

            return Json(HttpStatusCode.NotFound, """{"detail":"unmocked"}""");
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://review-harness.test/") };
        OperatorReviewJourneyRunner runner = CreateRunner(http);

        JourneyReport report = await runner.RunAsync();

        report.AllPassed.Should().BeFalse();
        report.Steps.Should().Contain(s => s.Name == "create-request" && !s.Passed);
    }

    [Fact]
    public async Task Runner_fails_when_real_ai_gate_rejects_simulator_mode()
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
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunDetailReadyForCommitSimulator());
            }

            return Json(HttpStatusCode.NotFound, """{"detail":"unmocked"}""");
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://review-harness.test/") };
        JourneyOptions options = new()
        {
            ApiBaseUrl = "http://review-harness.test",
            TimeoutSeconds = 30,
            PollIntervalSeconds = 1,
            RequireNonZeroLlmTokens = true,
        };
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        OperatorReviewJourneyRunner runner = new(http, options, catalog);

        JourneyReport report = await runner.RunAsync();

        report.AllPassed.Should().BeFalse();
        report.Steps.Should().Contain(s => s.Name == "verify-real-ai" && !s.Passed);
    }

    [Fact]
    public async Task Runner_fails_when_poll_reaches_terminal_failed_status()
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
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunDetailFailed());
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/execute", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, "{}");
            }

            return Json(HttpStatusCode.NotFound, """{"detail":"unmocked"}""");
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://review-harness.test/") };
        OperatorReviewJourneyRunner runner = CreateRunner(http);

        JourneyReport report = await runner.RunAsync();

        report.AllPassed.Should().BeFalse();
        report.Steps.Should().Contain(s => s.Name == "poll-until-ready" && !s.Passed);
        report.Steps.Should().Contain(s => s.Detail.Contains("Failed", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Runner_skips_execute_when_create_already_ready_for_commit()
    {
        bool executeCalled = false;

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

            if (request.Method == HttpMethod.Post && path.EndsWith("/execute", StringComparison.OrdinalIgnoreCase))
            {
                executeCalled = true;

                return Json(HttpStatusCode.InternalServerError, """{"detail":"execute should not run"}""");
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
                return Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.CursorPagedRunListItems());
            }

            return Json(HttpStatusCode.NotFound, """{"detail":"unmocked"}""");
        });

        using HttpClient http = new(handler) { BaseAddress = new Uri("http://review-harness.test/") };
        OperatorReviewJourneyRunner runner = CreateRunner(http);

        JourneyReport report = await runner.RunAsync();

        executeCalled.Should().BeFalse();
        report.Steps.Should().Contain(s =>
            s.Name == "execute" &&
            s.Passed &&
            s.Detail.Contains("Skipped", StringComparison.OrdinalIgnoreCase));
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
            Headers = { { "X-Correlation-ID", "corr-failure-path" } },
        };
}
