using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Reporting;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

using MvcProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

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

    [SkippableFact]
    public async Task Finalize_with_open_verify_hypothesis_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-FINALIZE-VERIFY-HYP-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectVerifyHypothesisScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain("hypothesis");
    }

    [SkippableFact]
    public async Task Get_readiness_with_open_verify_hypothesis_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-READINESS-VERIFY-HYP-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectVerifyHypothesisScorecardFindingAsync(Factory, runId);

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("finalizeQualityGateEnabled").GetBoolean().Should().BeTrue();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain("hypothesis");

        JsonElement blocks = root.GetProperty("blocks");
        blocks.GetArrayLength().Should().BeGreaterThan(0);
        blocks.EnumerateArray().Should().Contain(block =>
            block.GetProperty("layer").GetString() == FinalizeReadinessLayers.Scorecard
            && block.GetProperty("code").GetString() == "scorecard"
            && block.GetProperty("message").GetString()!.Contains("hypothesis", StringComparison.Ordinal));

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain(root.GetProperty("blockedReasonSummary").GetString());
    }

    [SkippableFact]
    public async Task Finalize_with_open_contradiction_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-FINALIZE-CONTRADICTION-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectContradictionScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain("contradiction");
    }

    [SkippableFact]
    public async Task Get_readiness_with_open_contradiction_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-READINESS-CONTRADICTION-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectContradictionScorecardFindingAsync(Factory, runId);

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("finalizeQualityGateEnabled").GetBoolean().Should().BeTrue();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain("contradiction");

        JsonElement blocks = root.GetProperty("blocks");
        blocks.GetArrayLength().Should().BeGreaterThan(0);
        blocks.EnumerateArray().Should().Contain(block =>
            block.GetProperty("layer").GetString() == FinalizeReadinessLayers.Scorecard
            && block.GetProperty("code").GetString() == "scorecard"
            && block.GetProperty("message").GetString()!.Contains("contradiction", StringComparison.Ordinal));

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain(root.GetProperty("blockedReasonSummary").GetString());
    }

    [SkippableFact]
    public async Task Finalize_with_open_cannot_determine_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-FINALIZE-CANNOT-DETERMINE-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectCannotDetermineScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain("open question");
    }

    [SkippableFact]
    public async Task Get_readiness_with_open_cannot_determine_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-READINESS-CANNOT-DETERMINE-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectCannotDetermineScorecardFindingAsync(Factory, runId);

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("finalizeQualityGateEnabled").GetBoolean().Should().BeTrue();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain("open question");

        JsonElement blocks = root.GetProperty("blocks");
        blocks.GetArrayLength().Should().BeGreaterThan(0);
        blocks.EnumerateArray().Should().Contain(block =>
            block.GetProperty("layer").GetString() == FinalizeReadinessLayers.Scorecard
            && block.GetProperty("code").GetString() == "scorecard"
            && block.GetProperty("message").GetString()!.Contains("open question", StringComparison.Ordinal));

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain(root.GetProperty("blockedReasonSummary").GetString());
    }

    [SkippableFact]
    public async Task Finalize_with_unresolved_blocking_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-FINALIZE-BLOCKING-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectBlockingScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain("unresolved blocking");
    }

    [SkippableFact]
    public async Task Get_readiness_with_unresolved_blocking_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-READINESS-BLOCKING-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectBlockingScorecardFindingAsync(Factory, runId);

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain("unresolved blocking");

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Detail.Should().Contain(root.GetProperty("blockedReasonSummary").GetString());
    }

    [SkippableFact]
    public async Task Finalize_with_low_confidence_extraction_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-FINALIZE-LOW-CONF-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectLowConfidenceScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain("low confidence");
    }

    [SkippableFact]
    public async Task Get_readiness_with_low_confidence_extraction_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-READINESS-LOW-CONF-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectLowConfidenceScorecardFindingAsync(Factory, runId);

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain("low confidence");

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Detail.Should().Contain(root.GetProperty("blockedReasonSummary").GetString());
    }

    [SkippableFact]
    public async Task Finalize_with_unverified_assumptions_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-FINALIZE-ASSUMPTIONS-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectUnverifiedAssumptionScorecardFindingsAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.Conflict);
        problem.Detail.Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.Detail.Should().Contain("unverified assumptions");
    }

    [SkippableFact]
    public async Task Get_readiness_with_unverified_assumptions_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-READINESS-ASSUMPTIONS-409-");

        await FinalizeConflictSqlIntegrationFixture.InjectUnverifiedAssumptionScorecardFindingsAsync(Factory, runId);

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain("unverified assumptions");

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Detail.Should().Contain(root.GetProperty("blockedReasonSummary").GetString());
    }

    [SkippableFact]
    public async Task Finalize_when_pre_commit_gate_blocks_maps_governance_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-FINALIZE-PRECOMMIT-409-");

        await FinalizeConflictSqlIntegrationFixture.PinPreCommitGateBlockAsync(Factory, runId);

        string? expectedReason = await TryReadPreCommitReadinessBlockReasonAsync(runId);
        expectedReason.Should().NotBeNull("pinned critical finding and BlockCommitOnCritical pin must block pre-commit gate");

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem.Should().NotBeNull();
        problem!.Type.Should().Be(ProblemTypes.GovernancePreCommitBlocked);
        problem.Detail.Should().Be(expectedReason);
    }

    [SkippableFact]
    public async Task Get_readiness_pre_commit_block_matches_finalize_governance_conflict()
    {
        string runId = await CreateExecutedRunIdAsync("REQ-READINESS-PRECOMMIT-409-");

        await FinalizeConflictSqlIntegrationFixture.PinPreCommitGateBlockAsync(Factory, runId);

        string? expectedReason = await TryReadPreCommitReadinessBlockReasonAsync(runId);
        expectedReason.Should().NotBeNull("pinned critical finding and BlockCommitOnCritical pin must block pre-commit gate");

        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        root.GetProperty("readyToFinalize").GetBoolean().Should().BeFalse();
        root.GetProperty("blockedReasonSummary").GetString().Should().Contain(expectedReason);

        HttpResponseMessage finalizeResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/finalize",
            null);

        finalizeResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);

        MvcProblemDetails? problem = await finalizeResponse.Content.ReadFromJsonAsync<MvcProblemDetails>(JsonOptions);
        problem!.Type.Should().Be(ProblemTypes.GovernancePreCommitBlocked);
        problem.Detail.Should().Be(expectedReason);
    }

    private async Task<string?> TryReadPreCommitReadinessBlockReasonAsync(string runId)
    {
        HttpResponseMessage readinessResponse = await Client.GetAsync(
            $"/v1/governance/pre-finalize/readiness/{runId}");

        await readinessResponse.EnsureSuccessForTestAsync();

        using JsonDocument document = JsonDocument.Parse(await readinessResponse.Content.ReadAsStringAsync());
        JsonElement root = document.RootElement;

        foreach (JsonElement block in root.GetProperty("blocks").EnumerateArray())
        {
            if (block.GetProperty("code").GetString() == "pre_commit_gate"
                && block.GetProperty("layer").GetString() == FinalizeReadinessLayers.Governance)
            {
                return block.GetProperty("message").GetString();
            }
        }

        return null;
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

    private async Task<bool> RunHasOpenVerifyHypothesisFindingAsync(string runId)
    {
        HttpResponseMessage getRunResponse = await Client.GetAsync($"/v1/architecture/review/{runId}");
        await getRunResponse.EnsureSuccessForTestAsync();

        GetRunResponseDto? runPayload = await getRunResponse.Content.ReadFromJsonAsync<GetRunResponseDto>(JsonOptions);
        runPayload.Should().NotBeNull();

        string resultsJson = JsonSerializer.Serialize(runPayload!.Results, JsonOptions);
        List<AgentResult>? typedResults = JsonSerializer.Deserialize<List<AgentResult>>(resultsJson, JsonOptions);
        typedResults.Should().NotBeNull();

        IReadOnlyDictionary<string, Disposition> latestDispositions =
            await LoadLatestDispositionsFromCsvAsync(runId);

        foreach (AgentResult result in typedResults!)
        {
            if (result.Findings is null || result.Findings.Count == 0)
                continue;

            foreach (ArchitectureFinding architectureFinding in result.Findings)
            {
                if (architectureFinding is null || architectureFinding.IsMuted)
                    continue;

                latestDispositions.TryGetValue(
                    architectureFinding.FindingId,
                    out Disposition latestDisposition);

                Finding scorecardFinding = ToScorecardFinding(architectureFinding);

                Disposition? dispositionForSignal = latestDispositions.ContainsKey(architectureFinding.FindingId)
                    ? latestDisposition
                    : null;

                if (FinalizeQualityFindingSignals.IsOpenVerifyHypothesisJobView(
                        scorecardFinding,
                        dispositionForSignal))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private async Task<IReadOnlyDictionary<string, Disposition>> LoadLatestDispositionsFromCsvAsync(string runId)
    {
        HttpResponseMessage csvResponse = await Client.GetAsync(
            $"/v1/architecture/review/{runId}/findings/export/csv");

        await csvResponse.EnsureSuccessForTestAsync();

        string csv = await csvResponse.Content.ReadAsStringAsync();
        Dictionary<string, Disposition> dispositions = new(StringComparer.OrdinalIgnoreCase);
        string[] lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        for (int lineIndex = 1; lineIndex < lines.Length; lineIndex++)
        {
            string[] fields = SplitCsvLine(lines[lineIndex]);

            if (fields.Length < 18)
                continue;

            string findingId = fields[0].Trim();

            if (string.IsNullOrWhiteSpace(findingId))
                continue;

            string dispositionRaw = fields[17].Trim();

            if (string.IsNullOrWhiteSpace(dispositionRaw))
                continue;

            if (Enum.TryParse(dispositionRaw, ignoreCase: true, out Disposition disposition))
                dispositions[findingId] = disposition;
        }

        return dispositions;
    }

    private static Finding ToScorecardFinding(ArchitectureFinding architectureFinding)
    {
        return new Finding
        {
            FindingId = architectureFinding.FindingId,
            Title = architectureFinding.Message,
            Rationale = architectureFinding.ReasoningTrace ?? string.Empty,
            Severity = architectureFinding.Severity,
            IsMuted = architectureFinding.IsMuted,
            PolicyRuleId = architectureFinding.PolicyRuleId,
            EvidenceRefs = architectureFinding.EvidenceRefs?.ToList() ?? [],
            RecommendedActions = [],
            Properties = new Dictionary<string, string>(),
        };
    }

    private static string[] SplitCsvLine(string line)
    {
        List<string> fields = [];
        StringBuilder current = new();
        bool inQuotes = false;

        for (int index = 0; index < line.Length; index++)
        {
            char character = line[index];

            if (character == '"')
            {
                if (inQuotes && index + 1 < line.Length && line[index + 1] == '"')
                {
                    current.Append('"');
                    index++;
                    continue;
                }

                inQuotes = !inQuotes;
                continue;
            }

            if (character == ',' && !inQuotes)
            {
                fields.Add(current.ToString());
                current.Clear();
                continue;
            }

            current.Append(character);
        }

        fields.Add(current.ToString());

        return fields.ToArray();
    }
}
