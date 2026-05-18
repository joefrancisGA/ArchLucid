using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <c>GET /v1/architecture/run/{runId}/findings/export/csv</c>.
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
            await Client.GetAsync($"/v1/architecture/run/{runId:D}/findings/export/csv");

        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
