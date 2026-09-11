using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL-backed proof that finalize integrity conflicts and the unified readiness contract stay aligned end-to-end.
/// </summary>
[Trait("Category", "Slow")]
[Trait("Suite", "Core")]
public sealed class FinalizeConflictSqlIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Finalize_before_execute_maps_integrity_conflict_to_409()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-FINALIZE-409-" + Guid.NewGuid().ToString("N")[..8])));
        await createResponse.EnsureSuccessForTestAsync();

        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().Contain("authority lifecycle phase");
        problem.Detail.Should().Contain("pipeline must be Complete before seal");
    }

    [SkippableFact]
    public async Task Get_readiness_before_execute_matches_finalize_integrity_block()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-READINESS-409-" + Guid.NewGuid().ToString("N")[..8])));
        await createResponse.EnsureSuccessForTestAsync();

        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain("authority lifecycle phase");

        JsonElement blocks = root.GetProperty("blocks");
        blocks.GetArrayLength().Should().BeGreaterThan(0);
        blocks[0].GetProperty("layer").GetString().Should().Be("integrity");
        blocks[0].GetProperty("code").GetString().Should().Be("lifecycle_phase_incomplete");

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Detail.Should().Contain(root.GetProperty("blockedReasonSummary").GetString());
    }
}
