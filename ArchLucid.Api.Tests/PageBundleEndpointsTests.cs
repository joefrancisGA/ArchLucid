using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class PageBundleEndpointsTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetSponsorDashboardBundle_ReturnsOk_WithReportAndTrend()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/roi/sponsor-dashboard-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        SponsorDashboardBundleResponse? body =
            await response.Content.ReadFromJsonAsync<SponsorDashboardBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.SponsorReport.Should().NotBeNull();
        body.ComplianceDriftTrend.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetPolicyPacksPageBundle_ReturnsOk_WithCollections()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/policy-packs/page-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        PolicyPacksPageBundleResponse? body =
            await response.Content.ReadFromJsonAsync<PolicyPacksPageBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Packs.Should().NotBeNull();
        body.Effective.Should().NotBeNull();
        body.EffectiveContent.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetTeamsPageBundle_ReturnsOk_WithConnectionAndCatalog()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/integrations/teams/page-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        TeamsIncomingWebhookPageBundleResponse? body =
            await response.Content.ReadFromJsonAsync<TeamsIncomingWebhookPageBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Connection.Should().NotBeNull();
        body.TriggerCatalog.Should().NotBeNull();
    }
}
