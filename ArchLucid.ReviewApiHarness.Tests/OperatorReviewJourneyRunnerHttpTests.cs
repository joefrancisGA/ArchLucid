using System.Net;
using System.Text;

using FluentAssertions;

namespace ArchLucid.ReviewApiHarness.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OperatorReviewJourneyRunnerHttpTests
{
    [Fact]
    public async Task Runner_fails_fast_when_health_ready_is_down()
    {
        using DelegatingTestHttpHandler handler = new(async (request, _) =>
        {
            if (request.RequestUri!.AbsolutePath.EndsWith("/health/ready", StringComparison.OrdinalIgnoreCase))
            {
                return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                {
                    Content = new StringContent("not ready", Encoding.UTF8, "text/plain")
                };
            }

            return new HttpResponseMessage(HttpStatusCode.NotFound);
        });

        using HttpClient http = new(handler)
        {
            BaseAddress = new Uri("http://review-harness.test/")
        };

        string snapshotPath = OpenApiContractCatalog.ResolveDefaultSnapshotPath();
        OpenApiContractCatalog catalog = OpenApiContractCatalog.Load(snapshotPath);
        JourneyOptions options = new() { ApiBaseUrl = "http://review-harness.test" };
        OperatorReviewJourneyRunner runner = new(http, options, catalog);

        JourneyReport report = await runner.RunAsync();

        report.AllPassed.Should().BeFalse();
        report.Steps.Should().ContainSingle();
        report.Steps[0].Name.Should().Be("health-ready");
        report.Steps[0].Passed.Should().BeFalse();
        report.Steps[0].ElapsedMilliseconds.Should().BeGreaterThanOrEqualTo(0);
    }
}
