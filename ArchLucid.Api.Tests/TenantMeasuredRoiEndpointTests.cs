using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.Routing;
using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class TenantMeasuredRoiEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetTenantMeasuredRoi_returns_200_with_snapshot_and_disclaimer()
    {
        HttpResponseMessage response = await Client.GetAsync($"/{ApiV1Routes.TenantMeasuredRoi}");        TenantMeasuredRoiResponse? body =
            await response.ReadJsonForTestAsync<TenantMeasuredRoiResponse>(JsonOptions);

        body.Should().NotBeNull();
        body.Disclaimer.Should().NotBeNullOrWhiteSpace();
        body.Snapshot.Should().NotBeNull();
        body.Snapshot.DemoRunId.Should().Be(HarnessDemoBaselineSupport.DemoRunId);
        body.Snapshot.RunsCreatedTotal.Should().BeGreaterThanOrEqualTo(0);
    }
}
