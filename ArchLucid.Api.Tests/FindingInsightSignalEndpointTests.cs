using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.Bootstrap;
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
public sealed class FindingInsightSignalEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    private static string DemoPrimaryFindingId =>
        $"finding-demo-{ContosoRetailDemoIdentifiers.AuthorityRunBaselineId:N}-primary";

    private async Task EnsureDemoBaselineSeededAsync()
    {
        using IServiceScope serviceScope = Factory.Services.CreateScope();
        await serviceScope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_seeded_returns_204_and_get_lists_kind()
    {
        await EnsureDemoBaselineSeededAsync();

        Guid runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        HttpResponseMessage postResponse = await Client.PostAsJsonAsync(
            $"/v1/runs/{runId:D}/findings/{DemoPrimaryFindingId}/insight-signal",
            body,
            JsonOptions);

        postResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        HttpResponseMessage getResponse = await Client.GetAsync(
            $"/v1/runs/{runId:D}/findings/{DemoPrimaryFindingId}/insight-signal");

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        FindingInsightSignalStatusResponse? status =
            await getResponse.Content.ReadFromJsonAsync<FindingInsightSignalStatusResponse>(JsonOptions);

        status.Should().NotBeNull();
        status!.Kinds.Should().Contain(FindingInsightSignalKind.DidNotThinkOfThat);
    }

    [SkippableFact]
    public async Task PostInsightSignal_second_click_is_idempotent_for_same_kind()
    {
        await EnsureDemoBaselineSeededAsync();

        Guid runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };
        string url = $"/v1/runs/{runId:D}/findings/{DemoPrimaryFindingId}/insight-signal";

        HttpResponseMessage first = await Client.PostAsJsonAsync(url, body, JsonOptions);
        HttpResponseMessage second = await Client.PostAsJsonAsync(url, body, JsonOptions);

        first.StatusCode.Should().Be(HttpStatusCode.NoContent);
        second.StatusCode.Should().Be(HttpStatusCode.NoContent);

        FindingInsightSignalStatusResponse? status = await (
            await Client.GetAsync(url)).Content.ReadFromJsonAsync<FindingInsightSignalStatusResponse>(JsonOptions);

        status!.Kinds.Count(kind => kind == FindingInsightSignalKind.DidNotThinkOfThat).Should().Be(1);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_finding_unknown_returns_404()
    {
        await EnsureDemoBaselineSeededAsync();

        Guid runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        HttpResponseMessage response = await Client.PostAsJsonAsync(
            $"/v1/runs/{runId:D}/findings/does-not-exist/insight-signal",
            body,
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_run_unknown_returns_404()
    {
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };
        Guid unknownRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        HttpResponseMessage response = await Client.PostAsJsonAsync(
            $"/v1/runs/{unknownRunId:D}/findings/{DemoPrimaryFindingId}/insight-signal",
            body,
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_other_tenant_scope_returns_404()
    {
        await EnsureDemoBaselineSeededAsync();

        Guid runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        using HttpClient foreignClient = Factory.CreateClient();
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-tenant-id",
            Guid.Parse("77777777-7777-7777-7777-777777777777").ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-workspace-id",
            ScopeIds.DefaultWorkspace.ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-project-id",
            ScopeIds.DefaultProject.ToString("D"));

        HttpResponseMessage response = await foreignClient.PostAsJsonAsync(
            $"/v1/runs/{runId:D}/findings/{DemoPrimaryFindingId}/insight-signal",
            body,
            JsonOptions);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task PostInsightSignal_when_body_missing_returns_400()
    {
        HttpResponseMessage response = await Client.PostAsync(
            $"/v1/runs/{ContosoRetailDemoIdentifiers.AuthorityRunBaselineId:D}/findings/{DemoPrimaryFindingId}/insight-signal",
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

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/v1/runs/{ContosoRetailDemoIdentifiers.AuthorityRunBaselineId:D}/findings/{DemoPrimaryFindingId}/insight-signal",
            body,
            JsonOptions);

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
