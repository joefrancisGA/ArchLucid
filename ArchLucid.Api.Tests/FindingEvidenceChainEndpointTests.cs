using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Smoke coverage for the explainability evidence-chain route (404 on unknown run is stable contract surface).
/// </summary>
[Trait("Suite", "Integration")]
[Trait("Category", "Integration")]
public sealed class FindingEvidenceChainEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetFindingEvidenceChain_WhenRunUnknown_Returns404()
    {
        HttpResponseMessage response = await Client.GetReviewFindingEvidenceChainHttpAsync(
            HarnessWellKnownGuids.UnknownRunForEvidenceChain,
            "any-finding");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
