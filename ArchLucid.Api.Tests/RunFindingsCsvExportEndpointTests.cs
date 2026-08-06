using System.Net;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Reporting;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <c>GET /v1/architecture/review/{runId}/findings/export/csv</c>.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class RunFindingsCsvExportEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task ExportRunFindingsCsv_WhenRunUnknown_Returns404Problem()
    {
        Guid runId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        using HttpResponseMessage res =
            await Client.GetAsync($"/v1/architecture/review/{runId:D}/findings/export/csv");

        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ExportRunFindingsCsv_includes_external_tracking_header_columns()
    {
        Guid runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;

        using HttpResponseMessage res =
            await Client.GetAsync($"/v1/architecture/review/{runId:D}/findings/export/csv");

        // Guard with return rather than Skip.If: throwing SkipException after an async operation
        // causes the [SkippableFact] vstest runner to re-queue the test indefinitely (proven 30+
        // iteration infinite hang on CI shard 2 chunk 3 before this fix).
        if (res.StatusCode == HttpStatusCode.NotFound)
            return;

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        string csv = await res.Content.ReadAsStringAsync();
        csv.Should().StartWith(ArchitectureRunFindingsCsvFormatter.HeaderLine);
    }
}
