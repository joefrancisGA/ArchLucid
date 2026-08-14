using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models.Runs;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Governance;
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

    [SkippableFact]
    public async Task GetFindingsRegistersBundle_ReturnsOk_WithRegisters()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/governance/findings-registers-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        GovernanceFindingsRegistersBundleResponse? body =
            await response.Content.ReadFromJsonAsync<GovernanceFindingsRegistersBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.RiskRegister.Should().NotBeNull();
        body.DecisionRegister.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetJiraPageBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/integrations/itsm/jira/page-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        ItsmProviderIntegrationPageBundleResponse? body =
            await response.Content.ReadFromJsonAsync<ItsmProviderIntegrationPageBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.Health.Should().NotBeNull();
        body.Settings.Should().NotBeNull();
        body.Connection.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetItsmHealth_ReturnsOk_WithoutLiveProbe()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/integrations/itsm/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [SkippableFact]
    public async Task GetIdentityProvidersPageBundle_ReturnsOk_WithDiagnosticsSlices()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/admin/diagnostics/identity-providers-page-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        ArchLucid.Api.Models.Admin.AdminIdentityProvidersPageBundleResponse? body =
            await response.Content.ReadFromJsonAsync<ArchLucid.Api.Models.Admin.AdminIdentityProvidersPageBundleResponse>(
                JsonOptions);

        body.Should().NotBeNull();
        body!.IdentityProviderDiagnostics.Should().NotBeNull();
        body.AuthConfigurationDiagnostics.Should().NotBeNull();
        body.OidcDiagnostics.Should().NotBeNull();
        body.SamlOperationalHealth.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetGovernanceSetupGuideBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/governance/setup-guide-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        GovernanceSetupGuideBundleResponse? body =
            await response.Content.ReadFromJsonAsync<GovernanceSetupGuideBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.EffectivePolicyPacks.Should().NotBeNull();
        body.AlertRoutingSubscriptions.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetAlertsInboxWorkspaceContext_ReturnsOk_WithSignals()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/alerts/inbox/workspace-context");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        AlertsInboxWorkspaceContextResponse? body =
            await response.Content.ReadFromJsonAsync<AlertsInboxWorkspaceContextResponse>(JsonOptions);

        body.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetRoiSummaryPageBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/tenant/roi-summary-page-bundle?rollingDays=30");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        ArchLucid.Api.Models.Tenancy.TenantRoiSummaryPageBundleResponse? body =
            await response.Content.ReadFromJsonAsync<ArchLucid.Api.Models.Tenancy.TenantRoiSummaryPageBundleResponse>(
                JsonOptions);

        body.Should().NotBeNull();
        body!.PilotToDate.Should().NotBeNull();
        body.RollingWindow.Should().NotBeNull();
        body.PilotToDatePreCommitBlocks.Should().NotBeNull();
        body.RollingWindowPreCommitBlocks.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetAdminPrerequisitesCloudConnectionsSummary_ReturnsOk()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/admin/prerequisites/cloud-connections-summary");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task GetRunDetailCriticalPageBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-PAGEBUNDLE-CRITICAL-001")));

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        Guid runId = Guid.Parse(created!.Run.RunId);

        HttpResponseMessage executeResponse = await Client.PostAsync($"/v1/architecture/review/{runId:D}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/reviews/{runId:D}/critical-page-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        RunDetailCriticalPageBundleResponse? body =
            await response.Content.ReadFromJsonAsync<RunDetailCriticalPageBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.BuyerSummary.Should().NotBeNull();
        body.BuyerSummary.Run.RunId.Should().Be(runId);
        body.ProgressSummary.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetRunDetailTimelinesBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-PAGEBUNDLE-TIMELINES-001")));

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        Guid runId = Guid.Parse(created!.Run.RunId);

        HttpResponseMessage executeResponse = await Client.PostAsync($"/v1/architecture/review/{runId:D}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/reviews/{runId:D}/timelines-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        RunDetailTimelinesBundleResponse? body =
            await response.Content.ReadFromJsonAsync<RunDetailTimelinesBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.PipelineTimeline.Should().NotBeNull();
        body.StageTimeline.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetRunDetailWorkspaceContextBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-PAGEBUNDLE-WORKSPACE-001")));

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        Guid runId = Guid.Parse(created!.Run.RunId);

        HttpResponseMessage executeResponse = await Client.PostAsync($"/v1/architecture/review/{runId:D}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/reviews/{runId:D}/workspace-context-bundle");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        RunDetailWorkspaceContextBundleResponse? body =
            await response.Content.ReadFromJsonAsync<RunDetailWorkspaceContextBundleResponse>(JsonOptions);

        body.Should().NotBeNull();
        body!.RecentProjectRuns.Should().NotBeNull();
    }
}
