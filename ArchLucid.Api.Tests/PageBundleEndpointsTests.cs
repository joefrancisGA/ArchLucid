using System.Net;

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

        SponsorDashboardBundleResponse body =
            await response.ReadJsonForTestAsync<SponsorDashboardBundleResponse>(JsonOptions);

        body.SponsorReport.Should().NotBeNull();
        body.ComplianceDriftTrend.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetPolicyPacksPageBundle_ReturnsOk_WithCollections()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/policy-packs/page-bundle");

        PolicyPacksPageBundleResponse body =
            await response.ReadJsonForTestAsync<PolicyPacksPageBundleResponse>(JsonOptions);

        body.Packs.Should().NotBeNull();
        body.Effective.Should().NotBeNull();
        body.EffectiveContent.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetTeamsPageBundle_ReturnsOk_WithConnectionAndCatalog()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/integrations/teams/page-bundle");

        TeamsIncomingWebhookPageBundleResponse body =
            await response.ReadJsonForTestAsync<TeamsIncomingWebhookPageBundleResponse>(JsonOptions);

        body.Connection.Should().NotBeNull();
        body.TriggerCatalog.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetFindingsRegistersBundle_ReturnsOk_WithRegisters()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/governance/findings-registers-bundle");

        GovernanceFindingsRegistersBundleResponse body =
            await response.ReadJsonForTestAsync<GovernanceFindingsRegistersBundleResponse>(JsonOptions);

        body.RiskRegister.Should().NotBeNull();
        body.DecisionRegister.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetJiraPageBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/integrations/itsm/jira/page-bundle");

        ItsmProviderIntegrationPageBundleResponse body =
            await response.ReadJsonForTestAsync<ItsmProviderIntegrationPageBundleResponse>(JsonOptions);

        body.Health.Should().NotBeNull();
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

        ArchLucid.Api.Models.Admin.AdminIdentityProvidersPageBundleResponse body =
            await response.ReadJsonForTestAsync<ArchLucid.Api.Models.Admin.AdminIdentityProvidersPageBundleResponse>(
                JsonOptions);

        body.IdentityProviderDiagnostics.Should().NotBeNull();
        body.AuthConfigurationDiagnostics.Should().NotBeNull();
        body.OidcDiagnostics.Should().NotBeNull();
        body.SamlOperationalHealth.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetGovernanceSetupGuideBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/governance/setup-guide-bundle");

        GovernanceSetupGuideBundleResponse body =
            await response.ReadJsonForTestAsync<GovernanceSetupGuideBundleResponse>(JsonOptions);

        body.EffectivePolicyPacks.Should().NotBeNull();
        body.AlertRoutingSubscriptions.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetAlertsInboxWorkspaceContext_ReturnsOk_WithSignals()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/alerts/inbox/workspace-context");

        await response.ReadJsonForTestAsync<AlertsInboxWorkspaceContextResponse>(JsonOptions);
    }

    [SkippableFact]
    public async Task GetRoiSummaryPageBundle_ReturnsOk_WithSlices()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/tenant/roi-summary-page-bundle?rollingDays=30");

        ArchLucid.Api.Models.Tenancy.TenantRoiSummaryPageBundleResponse body =
            await response.ReadJsonForTestAsync<ArchLucid.Api.Models.Tenancy.TenantRoiSummaryPageBundleResponse>(
                JsonOptions);

        body.PilotToDate.Should().NotBeNull();
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
        CreatedRunForTest created = await RunReadyForExecuteAsync();
        Guid runId = created.RunGuid;

        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/reviews/{runId:D}/critical-page-bundle");

        RunDetailCriticalPageBundleResponse body =
            await response.ReadJsonForTestAsync<RunDetailCriticalPageBundleResponse>(JsonOptions);

        body.BuyerSummary.Should().NotBeNull();
        body.BuyerSummary.Run.RunId.Should().Be(runId);
        body.ProgressSummary.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetRunDetailTimelinesBundle_ReturnsOk_WithSlices()
    {
        CreatedRunForTest created = await RunReadyForExecuteAsync();
        Guid runId = created.RunGuid;

        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/reviews/{runId:D}/timelines-bundle");

        RunDetailTimelinesBundleResponse body =
            await response.ReadJsonForTestAsync<RunDetailTimelinesBundleResponse>(JsonOptions);

        body.PipelineTimeline.Should().NotBeNull();
        body.StageTimeline.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetRunDetailWorkspaceContextBundle_ReturnsOk_WithSlices()
    {
        CreatedRunForTest created = await RunReadyForExecuteAsync();
        Guid runId = created.RunGuid;

        HttpResponseMessage response =
            await Client.GetAsync($"/v1/authority/reviews/{runId:D}/workspace-context-bundle");

        RunDetailWorkspaceContextBundleResponse body =
            await response.ReadJsonForTestAsync<RunDetailWorkspaceContextBundleResponse>(JsonOptions);

        body.RecentProjectRuns.Should().NotBeNull();
    }
}
