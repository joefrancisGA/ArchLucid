using System.Net;
using System.Net.Http.Json;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class InsightDensityNoveltyRatesEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    private static string DemoPrimaryFindingId =>
        $"finding-demo-{ContosoRetailDemoIdentifiers.AuthorityRunBaselineId:N}-primary";

    private async Task EnsureDemoBaselineSeededAsync()
    {
        using IServiceScope serviceScope = Factory.Services.CreateScope();
        await serviceScope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();
    }

    [SkippableFact]
    public async Task GetNoveltyRates_after_signal_records_engine_row()
    {
        await EnsureDemoBaselineSeededAsync();

        Guid runId = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        HttpResponseMessage postResponse = await Client.PostAsJsonAsync(
            $"/v1/runs/{runId:D}/findings/{DemoPrimaryFindingId}/insight-signal",
            body,
            JsonOptions);

        postResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        DateTime toUtc = DateTime.UtcNow.AddMinutes(5);
        DateTime fromUtc = toUtc.AddDays(-30);
        string url =
            $"/v1/tenants/current/insight-density/novelty-rates?from={fromUtc:O}&to={toUtc:O}";

        HttpResponseMessage getResponse = await Client.GetAsync(url);

        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        EngineInsightNoveltyRatesResponse? payload =
            await getResponse.Content.ReadFromJsonAsync<EngineInsightNoveltyRatesResponse>(JsonOptions);

        payload.Should().NotBeNull();
        payload!.Rows.Should().NotBeEmpty();
        payload.Rows.Should().Contain(row => row.DidNotThinkOfThatCount >= 1);
    }

    [SkippableFact]
    public async Task GetNoveltyRates_when_other_tenant_scope_returns_empty_rows()
    {
        await EnsureDemoBaselineSeededAsync();

        DateTime toUtc = DateTime.UtcNow.AddMinutes(5);
        DateTime fromUtc = toUtc.AddDays(-7);
        string url =
            $"/v1/tenants/current/insight-density/novelty-rates?from={fromUtc:O}&to={toUtc:O}";

        using HttpClient foreignClient = Factory.CreateClient();
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-tenant-id",
            Guid.Parse("77777777-7777-7777-7777-777777777777").ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-workspace-id",
            Guid.Parse("88888888-8888-8888-8888-888888888888").ToString("D"));
        foreignClient.DefaultRequestHeaders.TryAddWithoutValidation(
            "x-project-id",
            Guid.Parse("99999999-9999-9999-9999-999999999999").ToString("D"));

        HttpResponseMessage response = await foreignClient.GetAsync(url);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        EngineInsightNoveltyRatesResponse? payload =
            await response.Content.ReadFromJsonAsync<EngineInsightNoveltyRatesResponse>(JsonOptions);
        payload!.Rows.Should().BeEmpty();
    }
}
