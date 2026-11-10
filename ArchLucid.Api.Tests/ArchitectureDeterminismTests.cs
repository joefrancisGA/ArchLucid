using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Determinism.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class ArchitectureDeterminismTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task DeterminismCheck_ReturnsResult()
    {
        CreatedRunForTest created = await RunReadyForExecuteAsync();
        string runId = created.RunId;
        var request = new { iterations = 3, executionMode = "Current", commitReplays = false };

        HttpResponseMessage response = await Client.PostAsync(
            $"/v1/internal/architecture/runs/{runId}/determinism-check",
            JsonContent(request));        DeterminismCheckResponse? payload =
            await response.ReadJsonForTestAsync<DeterminismCheckResponse>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Result.SourceRunId.Should().Be(runId);
        payload.Result.Iterations.Should().Be(3);
        payload.Result.IterationResults.Should().HaveCount(3);
    }
}
