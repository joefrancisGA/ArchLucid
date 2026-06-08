using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-287: ReadAuthority readers get trace summaries only; operator forensics routes require elevated role.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ForensicsTracePartitionIntegrationTests
{
    [SkippableFact]
    public async Task Reader_can_list_trace_summaries_without_prompt_fields()
    {
        await using ArchLucidApiFactory seedFactory = new();
        string runId = await CreateExecutedRunAsync(seedFactory);

        await using ReaderRoleArchLucidApiFactory readerFactory = new(seedFactory.SqlConnectionString);
        using HttpClient readerClient = readerFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(readerClient);

        HttpResponseMessage tracesResponse =
            await readerClient.GetAsync($"/v1/architecture/run/{runId}/traces");

        tracesResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        string json = await tracesResponse.Content.ReadAsStringAsync();
        json.Should().NotContain("systemPrompt", "summary traces must not expose prompts.");
        json.Should().NotContain("rawResponse", "summary traces must not expose raw model output.");
        json.Should().NotContain("userPrompt", "summary traces must not expose user prompts.");

        AgentExecutionTraceResponse? payload =
            await tracesResponse.Content.ReadFromJsonAsync<AgentExecutionTraceResponse>();
        payload.Should().NotBeNull();
        payload!.Traces.Should().NotBeEmpty();
    }

    [SkippableFact]
    public async Task Reader_is_forbidden_from_tool_invocation_forensics_and_internal_trace_forensics()
    {
        await using ArchLucidApiFactory seedFactory = new();
        string runId = await CreateExecutedRunAsync(seedFactory);

        await using ReaderRoleArchLucidApiFactory readerFactory = new(seedFactory.SqlConnectionString);
        using HttpClient readerClient = readerFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(readerClient);

        HttpResponseMessage toolForensics =
            await readerClient.GetAsync($"/v1/architecture/run/{runId}/tool-invocation-forensics");
        toolForensics.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        HttpResponseMessage internalForensics =
            await readerClient.GetAsync($"/v1/internal/architecture/run/{runId}/traces/forensics");
        internalForensics.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [SkippableFact]
    public async Task Operator_can_read_internal_trace_forensics_with_prompt_fields_when_present()
    {
        await using ArchLucidApiFactory seedFactory = new();
        string runId = await CreateExecutedRunAsync(seedFactory);

        await using OperatorRoleArchLucidApiFactory operatorFactory = new(seedFactory.SqlConnectionString);
        using HttpClient operatorClient = operatorFactory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(operatorClient);

        HttpResponseMessage response =
            await operatorClient.GetAsync($"/v1/internal/architecture/run/{runId}/traces/forensics");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using JsonDocument doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        JsonElement traces = doc.RootElement.GetProperty("traces");
        traces.GetArrayLength().Should().BeGreaterThan(0);
    }

    private static async Task<string> CreateExecutedRunAsync(ArchLucidApiFactory factory)
    {
        using HttpClient client = factory.CreateClient();

        HttpResponseMessage createResponse = await client.PostAsync(
            "/v1/architecture/request",
            ArchitectureRequestConcurrencyTestSupport.JsonContent(
                TestRequestFactory.CreateArchitectureRequest("REQ-FORENSICS-001")));

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>();
        string runId = created!.Run.RunId;

        HttpResponseMessage executeResponse = await client.PostAsync($"/v1/architecture/run/{runId}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();

        return runId;
    }
}
