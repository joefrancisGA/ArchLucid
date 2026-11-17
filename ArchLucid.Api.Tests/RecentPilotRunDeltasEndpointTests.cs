using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     HTTP coverage for <c>GET /v1/pilots/runs/recent-deltas</c> — the aggregated proof-of-ROI endpoint
///     behind the BeforeAfterDeltaPanel top / sidebar variants.
/// </summary>
/// <remarks>
///     The integration host runs against an empty-by-default scope (no seeded committed runs), so the
///     contract surface we can assert here is: 200 OK, well-formed JSON envelope, count clamped to the
///     server-side bounds, and ReadAuthority gating (the integration host's DevelopmentBypass already
///     supplies a Read principal — a 401/403 here would mean we accidentally tightened the policy).
/// </remarks>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class RecentPilotRunDeltasEndpointTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetRecentDeltas_DefaultCount_ReturnsOkWithRequestedCountFive()
    {
        HttpResponseMessage response = await Client.GetRecentPilotRunDeltasHttpAsync();
        RecentPilotRunDeltasResponse body =
            await response.ReadJsonForTestAsync<RecentPilotRunDeltasResponse>(JsonOptions);

        body.RequestedCount.Should().Be(5);
        body.ReturnedCount.Should().BeGreaterThanOrEqualTo(0);
        body.Items.Should().NotBeNull();
        body.ReturnedCount.Should().Be(body.Items.Count);
    }

    [SkippableFact]
    public async Task GetRecentDeltas_ExplicitCount_RespectedWhenInRange()
    {
        HttpResponseMessage response = await Client.GetRecentPilotRunDeltasHttpAsync(3);
        RecentPilotRunDeltasResponse body =
            await response.ReadJsonForTestAsync<RecentPilotRunDeltasResponse>(JsonOptions);

        body.RequestedCount.Should().Be(3);
    }

    [SkippableFact]
    public async Task GetRecentDeltas_ExcessiveCount_ClampedToServerSideMax()
    {
        HttpResponseMessage response = await Client.GetRecentPilotRunDeltasHttpAsync(9999);
        RecentPilotRunDeltasResponse body =
            await response.ReadJsonForTestAsync<RecentPilotRunDeltasResponse>(JsonOptions);

        body.RequestedCount.Should().BeLessThanOrEqualTo(25);
        body.RequestedCount.Should().BeGreaterThan(5);
    }

    [SkippableFact]
    public async Task GetRecentDeltas_ZeroOrNegativeCount_ClampedToOne()
    {
        HttpResponseMessage response = await Client.GetRecentPilotRunDeltasHttpAsync(-3);
        RecentPilotRunDeltasResponse body =
            await response.ReadJsonForTestAsync<RecentPilotRunDeltasResponse>(JsonOptions);

        body.RequestedCount.Should().Be(1);
    }

    [SkippableFact]
    public async Task GetRecentDeltas_ResponseEnvelope_BindsTypedContract()
    {
        HttpResponseMessage response = await Client.GetRecentPilotRunDeltasHttpAsync(5);

        RecentPilotRunDeltasResponse body =
            await response.ReadJsonForTestAsync<RecentPilotRunDeltasResponse>(JsonOptions);

        body.Items.Should().NotBeNull();
        body.RequestedCount.Should().Be(5);
        body.MedianTotalFindings.Should().BeNull();
        body.MedianTimeToCommittedManifestTotalSeconds.Should().BeNull();
    }
}
