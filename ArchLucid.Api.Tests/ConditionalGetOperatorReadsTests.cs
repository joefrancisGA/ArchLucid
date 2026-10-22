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
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-CONDGET-001")));
        await createResponse.EnsureSuccessForTestAsync();

        CreateRunResponseDto? createDoc =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = createDoc!.Run.RunId;

        HttpResponseMessage first = await Client.GetAsync($"/v1/architecture/review/{runId}");
        await first.EnsureSuccessForTestAsync();
        first.Headers.ETag.Should().NotBeNull();
        string etag = first.Headers.ETag!.Tag;

        using HttpRequestMessage conditional = new(HttpMethod.Get, $"/v1/architecture/review/{runId}");
        conditional.Headers.TryAddWithoutValidation("If-None-Match", etag);

        HttpResponseMessage cached = await Client.SendAsync(conditional);
        cached.StatusCode.Should().Be(HttpStatusCode.NotModified);
        (await cached.Content.ReadAsStringAsync()).Should().BeEmpty();
        cached.Headers.CacheControl?.ToString().Should().Contain("private");
    }

    [SkippableFact]
    public async Task GetRun_returns_new_etag_after_run_advances_row_version()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-CONDGET-002")));
        await createResponse.EnsureSuccessForTestAsync();

        CreateRunResponseDto? createDoc =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = createDoc!.Run.RunId;

        HttpResponseMessage beforeExecute = await Client.GetAsync($"/v1/architecture/review/{runId}");
        await beforeExecute.EnsureSuccessForTestAsync();
        string etagBefore = beforeExecute.Headers.ETag!.Tag;

        await Client.PostExecuteUnlessAuthorityPipelineCompleteAsync(runId);
        HttpResponseMessage commitResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/finalize", null);
        await commitResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage afterCommit = await Client.GetAsync($"/v1/architecture/review/{runId}");
        await afterCommit.EnsureSuccessForTestAsync();
        string etagAfter = afterCommit.Headers.ETag!.Tag;

        etagAfter.Should().NotBe(etagBefore);

        using HttpRequestMessage stale = new(HttpMethod.Get, $"/v1/architecture/review/{runId}");
        stale.Headers.TryAddWithoutValidation("If-None-Match", etagBefore);

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
