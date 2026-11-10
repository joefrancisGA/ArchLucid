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
        CreatedRunForTest created = await RunReadyForExecuteAsync();
        AgentExecutionTraceResponse payload = await created.GetTracesAsync(Client, JsonOptions);
        payload.Traces.Should().NotBeEmpty();
        payload.Traces.Should().Contain(t => !string.IsNullOrWhiteSpace(t.TraceId));
        payload.Traces.Should().Contain(t => t.ParseSucceeded);
    }
}
