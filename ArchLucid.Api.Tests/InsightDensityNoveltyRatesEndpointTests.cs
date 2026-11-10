using System.Net;

using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait(HarnessGoldenPathGuardConstants.DemoBaselineTraitCategory, HarnessGoldenPathGuardConstants.DemoBaselineTraitValue)]
public sealed class InsightDensityNoveltyRatesEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetNoveltyRates_after_signal_records_engine_row()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        Guid runId = HarnessDemoBaselineSupport.AuthorityRunId;
        RecordFindingInsightSignalRequest body = new() { Kind = FindingInsightSignalKind.DidNotThinkOfThat };

        HttpResponseMessage postResponse = await Client.PostRunFindingInsightSignalHttpAsync(
            runId,
            HarnessDemoBaselineSupport.DemoPrimaryFindingId,
            IntegrationTestHttpContent.CreateJson(body, JsonOptions));

        postResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        DateTime toUtc = DateTime.UtcNow.AddMinutes(5);
        DateTime fromUtc = toUtc.AddDays(-30);
        string url =
            $"/v1/tenants/current/insight-density/novelty-rates?from={fromUtc:O}&to={toUtc:O}";

        HttpResponseMessage getResponse = await Client.GetAsync(url);
        EngineInsightNoveltyRatesResponse? payload =
            await getResponse.ReadJsonForTestAsync<EngineInsightNoveltyRatesResponse>(JsonOptions);

        payload.Should().NotBeNull();
        payload!.Rows.Should().NotBeEmpty();
        payload.Rows.Should().Contain(row => row.DidNotThinkOfThatCount >= 1);
    }

    [SkippableFact]
    public async Task GetNoveltyRates_when_other_tenant_scope_returns_empty_rows()
    {
        await HarnessDemoBaselineSupport.EnsureSeededAsync(Factory.Services);

        DateTime toUtc = DateTime.UtcNow.AddMinutes(5);
        DateTime fromUtc = toUtc.AddDays(-7);
        string url =
            $"/v1/tenants/current/insight-density/novelty-rates?from={fromUtc:O}&to={toUtc:O}";

        using HttpClient foreignClient = HarnessDemoBaselineSupport.CreateForeignTenantClient(
            Factory,
            Guid.Parse("88888888-8888-8888-8888-888888888888"),
            Guid.Parse("99999999-9999-9999-9999-999999999999"));

        HttpResponseMessage response = await foreignClient.GetAsync(url);
        EngineInsightNoveltyRatesResponse? payload =
            await response.ReadJsonForTestAsync<EngineInsightNoveltyRatesResponse>(JsonOptions);
        payload!.Rows.Should().BeEmpty();
    }
}
