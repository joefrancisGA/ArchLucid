using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Conditional GET (ETag / If-None-Match) on hot operator reads (TB-2158).</summary>
[Trait("Category", "Integration")]
public sealed class ConditionalGetOperatorReadsTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetRun_returns_304_when_if_none_match_matches_row_version_etag()
    {
        CreatedRunForTest created = await CreateRunForTestAsync();
        string runId = created.RunId;

        HttpResponseMessage first = await created.GetRunHttpAsync(Client);
        await first.EnsureSuccessForTestAsync();
        first.Headers.ETag.Should().NotBeNull();
        string etag = first.Headers.ETag!.Tag;

        using HttpRequestMessage conditional = created.CreateConditionalRunGetRequest(etag);

        HttpResponseMessage cached = await Client.SendAsync(conditional);
        cached.StatusCode.Should().Be(HttpStatusCode.NotModified);
        (await cached.Content.ReadAsStringAsync()).Should().BeEmpty();
        cached.Headers.CacheControl?.ToString().Should().Contain("private");
    }

    [SkippableFact]
    public async Task GetRun_returns_new_etag_after_run_advances_row_version()
    {
        CreatedRunForTest created = await CreateRunForTestAsync();
        string runId = created.RunId;

        HttpResponseMessage beforeExecute = await created.GetRunHttpAsync(Client);
        await beforeExecute.EnsureSuccessForTestAsync();
        string etagBefore = beforeExecute.Headers.ETag!.Tag;

        await ExecuteForTestAsync(runId);
        HttpResponseMessage commitResponse = await FinalizeRunAsync(runId);
        await commitResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage afterCommit = await created.GetRunHttpAsync(Client);
        await afterCommit.EnsureSuccessForTestAsync();
        string etagAfter = afterCommit.Headers.ETag!.Tag;

        etagAfter.Should().NotBe(etagBefore);

        using HttpRequestMessage stale = created.CreateConditionalRunGetRequest(etagBefore);

        HttpResponseMessage refreshed = await Client.SendAsync(stale);
        refreshed.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [SkippableFact]
    public async Task ListRuns_returns_304_on_repeat_when_etag_matches()
    {
        HttpResponseMessage first = await Client.GetAsync("/v1/architecture/reviews?take=10");
        await first.EnsureSuccessForTestAsync();
        first.Headers.ETag.Should().NotBeNull();
        string etag = first.Headers.ETag!.Tag;

        using HttpRequestMessage conditional = new(HttpMethod.Get, "/v1/architecture/reviews?take=10");
        conditional.Headers.TryAddWithoutValidation("If-None-Match", etag);

        HttpResponseMessage cached = await Client.SendAsync(conditional);
        cached.StatusCode.Should().Be(HttpStatusCode.NotModified);
        (await cached.Content.ReadAsStringAsync()).Should().BeEmpty();
    }

    [SkippableFact]
    public async Task GetAudit_returns_304_on_repeat_when_etag_matches()
    {
        HttpResponseMessage first = await Client.GetAsync("/v1/audit?take=25");
        await first.EnsureSuccessForTestAsync();
        first.Headers.ETag.Should().NotBeNull();
        string etag = first.Headers.ETag!.Tag;

        using HttpRequestMessage conditional = new(HttpMethod.Get, "/v1/audit?take=25");
        conditional.Headers.TryAddWithoutValidation("If-None-Match", etag);

        HttpResponseMessage cached = await Client.SendAsync(conditional);
        cached.StatusCode.Should().Be(HttpStatusCode.NotModified);
        (await cached.Content.ReadAsStringAsync()).Should().BeEmpty();
    }
}
