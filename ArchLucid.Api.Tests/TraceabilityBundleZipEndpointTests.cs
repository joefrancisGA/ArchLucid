using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <c>GET /v1/architecture/review/{runId}/traceability-bundle.zip</c> (404 contract for unknown
///     runs).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class TraceabilityBundleZipEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetTraceabilityBundleZip_WhenRunUnknown_Returns404Problem()
    {
        using HttpResponseMessage res = await Client.GetReviewTraceabilityBundleZipHttpAsync(
            HarnessWellKnownGuids.UnknownRunForReviewSubresource);

        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
