using System.Net;
using System.Text;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

/// <summary>Execute + poll branches when create does not immediately reach ReadyForCommit.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperatorReviewJourneyRunnerExecutePollTests
{
    [Fact]
    public async Task Runner_executes_and_polls_until_ready_when_create_stays_created()
    {
        int detailCalls = 0;

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
                detailCalls++;

                return detailCalls < 2
                    ? Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunDetailCreated())
                    : Json(HttpStatusCode.OK, ReviewApiHarnessValidPayloads.RunDetailReadyForCommit());
            }

            if (request.Method == HttpMethod.Post && path.EndsWith("/execute", StringComparison.OrdinalIgnoreCase))
            {
                return Json(HttpStatusCode.OK, "{}");
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
                    Content = new ByteArrayContent([0x50, 0x4b, 0x03, 0x04])
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
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(OpenApiContractCatalog.ResolveDefaultSnapshotPath());
        JourneyOptions options = new()
        {
            ApiBaseUrl = "http://review-harness.test",
            TimeoutSeconds = 30,
            PollIntervalSeconds = 1,
            RequireNonZeroLlmTokens = false
        };

        OperatorReviewJourneyRunner runner = new(http, options, catalog);
        JourneyReport report = await runner.RunAsync();

        report.AllPassed.Should().BeTrue();
        report.Steps.Should().Contain(s => s.Name == "execute" && s.Passed);
        report.Steps.Should().Contain(s => s.Name == "poll-until-ready" && s.Passed);
        detailCalls.Should().BeGreaterThanOrEqualTo(2);
    }

    private static HttpResponseMessage Json(HttpStatusCode status, string json) =>
        new(status)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
            Headers = { { "X-Correlation-ID", "corr-poll" } }
        };
}
