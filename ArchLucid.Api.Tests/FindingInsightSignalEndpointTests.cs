using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for run-scoped finding insight signals (DX-13).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait(HarnessGoldenPathGuardConstants.DemoBaselineTraitCategory, HarnessGoldenPathGuardConstants.DemoBaselineTraitValue)]
public sealed class FindingInsightSignalEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task PostInsightSignal_when_seeded_returns_204_and_get_lists_kind()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        Guid runId = HarnessDemoBaselineSupport.AuthorityRunId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        HttpResponseMessage postResponse = await Client.PostRunFindingInsightSignalHttpAsync(
            runId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        postResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        HttpResponseMessage getResponse = await Client.GetRunFindingInsightSignalHttpAsync(
            runId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId);

        FindingInsightSignalStatusResponse? status =
            await getResponse.ReadJsonForTestAsync<FindingInsightSignalStatusResponse>(JsonOptions);

        status.Should().NotBeNull();

        status!.Kinds.Should().Contain(FindingInsightSignalKind.DidNotThinkOfThat);
    }

    [SkippableFact]
    public async Task PostInsightSignal_second_click_is_idempotent_for_same_kind()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        Guid runId = HarnessDemoBaselineSupport.AuthorityRunId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        HttpResponseMessage first = await Client.PostRunFindingInsightSignalHttpAsync(
            runId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        HttpResponseMessage second = await Client.PostRunFindingInsightSignalHttpAsync(
            runId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        first.StatusCode.Should().Be(HttpStatusCode.NoContent);
        second.StatusCode.Should().Be(HttpStatusCode.NoContent);

        FindingInsightSignalStatusResponse status = await (
            await Client.GetRunFindingInsightSignalHttpAsync(runId, HarnessDemoBaselineSupport.DemoPrimaryFindingId))
            .ReadJsonForTestAsync<FindingInsightSignalStatusResponse>(JsonOptions);

        status.Kinds.Count(kind => kind == FindingInsightSignalKind.DidNotThinkOfThat).Should().Be(1);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_finding_unknown_returns_404()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        Guid runId = HarnessDemoBaselineSupport.AuthorityRunId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        HttpResponseMessage response = await Client.PostRunFindingInsightSignalHttpAsync(
            runId,
            "does-not-exist",
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_run_unknown_returns_404()
    {
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };
        Guid unknownRunId = HarnessWellKnownGuids.MismatchedRunForScopedFindingInspect;

        HttpResponseMessage response = await Client.PostRunFindingInsightSignalHttpAsync(
            unknownRunId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_other_tenant_scope_returns_404()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        Guid runId = HarnessDemoBaselineSupport.AuthorityRunId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        using HttpClient foreignClient = Factory.CreateClient();

        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-tenant-id",
            HarnessWellKnownTenants.ForeignTenantHeaderValue);
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-workspace-id",
            ScopeIds.DefaultWorkspace.ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-project-id",
            ScopeIds.DefaultProject.ToString("D"));

        HttpResponseMessage response = await foreignClient.PostRunFindingInsightSignalHttpAsync(
            runId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_body_missing_returns_400()
    {
        HttpResponseMessage response = await Client.PostRunFindingInsightSignalHttpAsync(
            HarnessDemoBaselineSupport.AuthorityRunId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_role_outside_execute_authority_returns_403()
    {
        await using NoExecuteAuthorityRoleApiFactory restrictedFactory = new();

        using HttpClient client = restrictedFactory.CreateClient();

        WireDefaultSqlIntegrationScopeHeaders(client);

        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        HttpResponseMessage response = await client.PostRunFindingInsightSignalHttpAsync(
            HarnessDemoBaselineSupport.AuthorityRunId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private sealed class NoExecuteAuthorityRoleApiFactory : ArchLucidApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);

            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?> { ["ArchLucidAuth:DevRole"] = "GuestNoRead" }));
        }
    }
}
