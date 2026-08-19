using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-287: ReadAuthority readers get trace summaries only; operator forensics routes require elevated role.
/// </summary>
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class ForensicsTracePartitionIntegrationTests(ForensicsTracePartitionSeedFixture seed)
    : IClassFixture<ForensicsTracePartitionSeedFixture>
{
    private const string SqlExplicitUnavailable = "SQL integration env not configured";

    [SkippableFact]
    public async Task Reader_can_list_trace_summaries_without_prompt_fields()
    {
        Skip.If(seed.ShardWarmupTimedOut, GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason);
        Skip.IfNot(seed.SqlReachable, SqlExplicitUnavailable);

        string runId = seed.ExecutedRunId!;

        await using ReaderRoleArchLucidApiFactory readerFactory = new(seed.SeedFactory!.SqlConnectionString);
        using HttpClient readerClient = readerFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(readerClient);

        HttpResponseMessage tracesResponse =
            await readerClient.GetAsync($"/v1/architecture/review/{runId}/traces");

        tracesResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        string json = await tracesResponse.Content.ReadAsStringAsync();
        json.Should().NotContain("systemPrompt", "summary traces must not expose prompts.");
        json.Should().NotContain("rawResponse", "summary traces must not expose raw model output.");
        json.Should().NotContain("userPrompt", "summary traces must not expose user prompts.");

        AgentExecutionTraceResponse? payload =
            await tracesResponse.Content.ReadFromJsonAsync<AgentExecutionTraceResponse>(IntegrationTestTraceJson.Options);
        payload.Should().NotBeNull();
        payload!.Traces.Should().NotBeEmpty();
    }

    [SkippableFact]
    public async Task Reader_is_forbidden_from_tool_invocation_forensics_and_internal_trace_forensics()
    {
        Skip.If(seed.ShardWarmupTimedOut, GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason);
        Skip.IfNot(seed.SqlReachable, SqlExplicitUnavailable);

        string runId = seed.ExecutedRunId!;

        await using ReaderRoleArchLucidApiFactory readerFactory = new(seed.SeedFactory!.SqlConnectionString);
        using HttpClient readerClient = readerFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(readerClient);

        HttpResponseMessage toolForensics =
            await readerClient.GetAsync($"/v1/architecture/review/{runId}/tool-invocation-forensics");
        toolForensics.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        HttpResponseMessage internalForensics =
            await readerClient.GetAsync($"/v1/internal/architecture/review/{runId}/traces/forensics");
        internalForensics.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Operator_can_read_internal_trace_forensics_list_and_full_trace_by_id()
    {
        Skip.If(seed.ShardWarmupTimedOut, GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason);
        Skip.IfNot(seed.SqlReachable, SqlExplicitUnavailable);

        string runId = seed.ExecutedRunId!;

        await using OperatorRoleArchLucidApiFactory operatorFactory = new(seed.SeedFactory!.SqlConnectionString);
        using HttpClient operatorClient = operatorFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(operatorClient);

        HttpResponseMessage listResponse =
            await operatorClient.GetAsync($"/v1/internal/architecture/review/{runId}/traces/forensics");

        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        AgentExecutionTraceForensicsPageResponse? page =
            await listResponse.Content.ReadFromJsonAsync<AgentExecutionTraceForensicsPageResponse>(
                IntegrationTestTraceJson.Options);
        page.Should().NotBeNull();
        page!.Traces.Should().NotBeEmpty();

        string traceId = page.Traces[0].TraceId;
        traceId.Should().NotBeNullOrWhiteSpace();

        HttpResponseMessage detailResponse =
            await operatorClient.GetAsync($"/v1/internal/architecture/traces/forensics/{traceId}");

        detailResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        string detailJson = await detailResponse.Content.ReadAsStringAsync();
        detailJson.Should().Contain("traceId", "full forensics payload includes trace identity.");
    }
}
