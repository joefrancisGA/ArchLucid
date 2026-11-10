using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Trace.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureTraceTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetRunTraces_ReturnsPromptAndRawResponseAfterExecute()
    {
        string runId = await CreateArchitectureRunAsync(TestRequestIds.ForScenario(nameof(ArchitectureTraceTests)));

        await ExecuteForTestAsync(runId);
        HttpResponseMessage tracesResponse = await Client.GetAsync($"/v1/architecture/review/{runId}/traces");        AgentExecutionTraceResponse? payload =
            await tracesResponse.ReadJsonForTestAsync<AgentExecutionTraceResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Traces.Should().NotBeEmpty();
        payload.Traces.Should().Contain(t => !string.IsNullOrWhiteSpace(t.TraceId));
        payload.Traces.Should().Contain(t => t.ParseSucceeded);
    }
}
