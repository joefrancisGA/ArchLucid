using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Findings;

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

    [SkippableFact]
    public async Task Finalize_after_execute_with_deferred_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-FINALIZE-SCORECARD-409-");

        IReadOnlyList<string> findingIds = await GetExportableFindingIdsAsync(runId);
        findingIds.Should().NotBeEmpty("simulator runs must expose at least one decision-grade finding for scorecard proof");

        string findingId = findingIds[0];

        HttpResponseMessage dispositionResponse = await PostGovernanceMutationAsync(
            "/v1/governance/findings/bulk-disposition",
            new
            {
                findingIds = new[] { findingId },
                disposition = FindingDisposition.Deferred,
                rationale = "Deferred for SQL integration scorecard block proof.",
                revisitDueUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        await dispositionResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain("deferred finding");
    }

    [SkippableFact]
    public async Task Get_readiness_after_deferred_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-READINESS-SCORECARD-409-");

        IReadOnlyList<string> findingIds = await GetExportableFindingIdsAsync(runId);
        findingIds.Should().NotBeEmpty("simulator runs must expose at least one decision-grade finding for scorecard proof");

        string findingId = findingIds[0];

        HttpResponseMessage dispositionResponse = await PostGovernanceMutationAsync(
            "/v1/governance/findings/bulk-disposition",
            new
            {
                findingIds = new[] { findingId },
                disposition = FindingDisposition.Deferred,
                rationale = "Deferred for SQL integration scorecard readiness proof.",
                revisitDueUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        await dispositionResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("finalizeQualityGateEnabled").GetBoolean().Should().BeTrue();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain("deferred finding");

        JsonElement blocks = root.GetProperty("blocks");
        blocks.GetArrayLength().Should().BeGreaterThan(0);
        blocks.EnumerateArray().Should().Contain(block =>
            block.GetProperty("layer").GetString() == FinalizeReadinessLayers.Scorecard
            && block.GetProperty("code").GetString() == "scorecard"
            && block.GetProperty("message").GetString()!.Contains("deferred finding", StringComparison.Ordinal));

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain(root.GetProperty("blockedReasonSummary").GetString());
    }

    private async Task<string> CreateExecutedRunIdAsync(string requestIdPrefix)
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest(requestIdPrefix + Guid.NewGuid().ToString("N")[..8])));

        await createResponse.EnsureSuccessForTestAsync();

        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        await Client.PostExecuteUnlessAuthorityPipelineCompleteAsync(runId);

        return runId;
    }

    private async Task<IReadOnlyList<string>> GetExportableFindingIdsAsync(string runId)
    {
        HttpResponseMessage csvResponse = await Client.GetAsync(
            $"/v1/architecture/review/{runId}/findings/export/csv");

        await csvResponse.EnsureSuccessForTestAsync();

        string csv = await csvResponse.Content.ReadAsStringAsync();
        csv.Should().StartWith(ArchitectureRunFindingsCsvFormatter.HeaderLine);

        List<string> findingIds = [];
        string[] lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        for (int lineIndex = 1; lineIndex < lines.Length; lineIndex++)
        {
            string line = lines[lineIndex];

            if (string.IsNullOrWhiteSpace(line))
                continue;

            int commaIndex = line.IndexOf(',', StringComparison.Ordinal);

            if (commaIndex <= 0)
                continue;

            string findingId = line[..commaIndex].Trim();

            if (!string.IsNullOrWhiteSpace(findingId))
                findingIds.Add(findingId);
        }

        return findingIds;
    }
}
