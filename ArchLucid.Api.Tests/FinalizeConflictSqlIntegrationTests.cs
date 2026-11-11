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
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL-backed proof that finalize integrity conflicts and the unified readiness contract stay aligned end-to-end.
/// </summary>
[Trait("Category", "Slow")]
[Trait("Suite", "Core")]
[Trait(HarnessGoldenPathGuardConstants.RouteProtocolTraitCategory, HarnessGoldenPathGuardConstants.RouteProtocolTraitValue)]
public sealed class FinalizeConflictSqlIntegrationTests(FinalizeConflictSqlIntegrationApiFactory factory)
    : IntegrationTestBase(factory), IClassFixture<FinalizeConflictSqlIntegrationApiFactory>
{
    [SkippableFact]
    public async Task Finalize_before_execute_maps_integrity_conflict_to_409()
    {
        HttpResponseMessage createResponse = await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests))));

        CreateRunResponseDto created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created.Run.RunId;

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("authority lifecycle phase");
        problem.GetProperty("detail").GetString().Should().Contain("pipeline must be Complete before seal");
    }

    [SkippableFact]
    public async Task Get_readiness_before_execute_matches_finalize_integrity_block()
    {
        HttpResponseMessage createResponse = await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests))));

        CreateRunResponseDto created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created.Run.RunId;

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("authority lifecycle phase");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks[0].Layer.Should().Be("integrity");
        readiness.Blocks[0].Code.Should().Be("lifecycle_phase_incomplete");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_after_execute_with_deferred_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectDeferredScorecardFindingAsync(Factory, runId);

        HttpResponseMessage dispositionResponse = await PostGovernanceMutationAsync(
            "/v1/governance/findings/bulk-disposition",
            new
            {
                findingIds = new[] { FinalizeConflictSqlIntegrationFixture.DeferredScorecardProofFindingId },
                disposition = FindingDisposition.Deferred,
                rationale = "Deferred for SQL integration scorecard block proof.",
                revisitDueUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        await dispositionResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("deferred finding");
    }

    [SkippableFact]
    public async Task Get_readiness_after_deferred_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectDeferredScorecardFindingAsync(Factory, runId);

        HttpResponseMessage dispositionResponse = await PostGovernanceMutationAsync(
            "/v1/governance/findings/bulk-disposition",
            new
            {
                findingIds = new[] { FinalizeConflictSqlIntegrationFixture.DeferredScorecardProofFindingId },
                disposition = FindingDisposition.Deferred,
                rationale = "Deferred for SQL integration scorecard readiness proof.",
                revisitDueUtc = DateTimeOffset.UtcNow.AddDays(30),
            });

        await dispositionResponse.EnsureSuccessForTestAsync();

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.FinalizeQualityGateEnabled.Should().BeTrue();
        readiness.BlockedReasonSummary.Should().Contain("deferred finding");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Scorecard
            && block.Code == "scorecard"
            && block.Message.Contains("deferred finding", StringComparison.Ordinal));

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_open_verify_hypothesis_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectVerifyHypothesisScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("hypothesis");
    }

    [SkippableFact]
    public async Task Get_readiness_with_open_verify_hypothesis_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectVerifyHypothesisScorecardFindingAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.FinalizeQualityGateEnabled.Should().BeTrue();
        readiness.BlockedReasonSummary.Should().Contain("hypothesis");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Scorecard
            && block.Code == "scorecard"
            && block.Message.Contains("hypothesis", StringComparison.Ordinal));

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_open_contradiction_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectContradictionScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("contradiction");
    }

    [SkippableFact]
    public async Task Get_readiness_with_open_contradiction_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectContradictionScorecardFindingAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.FinalizeQualityGateEnabled.Should().BeTrue();
        readiness.BlockedReasonSummary.Should().Contain("contradiction");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Scorecard
            && block.Code == "scorecard"
            && block.Message.Contains("contradiction", StringComparison.Ordinal));

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_open_cannot_determine_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectCannotDetermineScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("open question");
    }

    [SkippableFact]
    public async Task Get_readiness_with_open_cannot_determine_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectCannotDetermineScorecardFindingAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.FinalizeQualityGateEnabled.Should().BeTrue();
        readiness.BlockedReasonSummary.Should().Contain("open question");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Scorecard
            && block.Code == "scorecard"
            && block.Message.Contains("open question", StringComparison.Ordinal));

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_unresolved_blocking_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectBlockingScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("unresolved blocking");
    }

    [SkippableFact]
    public async Task Get_readiness_with_unresolved_blocking_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectBlockingScorecardFindingAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("unresolved blocking");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_low_confidence_extraction_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectLowConfidenceScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("low confidence");
    }

    [SkippableFact]
    public async Task Get_readiness_with_low_confidence_extraction_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectLowConfidenceScorecardFindingAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("low confidence");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_unverified_assumptions_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectUnverifiedAssumptionScorecardFindingsAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("unverified assumptions");
    }

    [SkippableFact]
    public async Task Get_readiness_with_unverified_assumptions_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectUnverifiedAssumptionScorecardFindingsAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("unverified assumptions");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_coverage_gap_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectCoverageGapScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("mandatory requirement");
        problem.GetProperty("detail").GetString().Should().Contain("design decision");
    }

    [SkippableFact]
    public async Task Get_readiness_with_coverage_gap_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectCoverageGapScorecardFindingAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("mandatory requirement");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_unresolved_high_severity_finding_maps_scorecard_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectUnresolvedHighSeverityScorecardFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().StartWith(FinalizeQualityGate.BlockedPrefix);
        problem.GetProperty("detail").GetString().Should().Contain("accepted-risk disposition");
    }

    [SkippableFact]
    public async Task Get_readiness_with_unresolved_high_severity_finding_matches_finalize_scorecard_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectUnresolvedHighSeverityScorecardFindingAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("accepted-risk disposition");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_when_pre_commit_gate_blocks_maps_governance_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinPreCommitGateBlockAsync(Factory, runId);

        string? expectedReason = await TryReadPreCommitReadinessBlockReasonAsync(runId);
        expectedReason.Should().NotBeNull("pinned critical finding and BlockCommitOnCritical pin must block pre-commit gate");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.GovernancePreCommitBlocked);
        problem.GetProperty("detail").GetString().Should().Be(expectedReason);
    }

    [SkippableFact]
    public async Task Get_readiness_pre_commit_block_matches_finalize_governance_conflict()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinPreCommitGateBlockAsync(Factory, runId);

        string? expectedReason = await TryReadPreCommitReadinessBlockReasonAsync(runId);
        expectedReason.Should().NotBeNull("pinned critical finding and BlockCommitOnCritical pin must block pre-commit gate");

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain(expectedReason);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.GovernancePreCommitBlocked);
        problem.GetProperty("detail").GetString().Should().Be(expectedReason);
    }

    [SkippableFact]
    public async Task Finalize_with_skipped_must_questions_maps_career_artifact_block_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinSkippedMustTransparencyTrailAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.GovernancePreCommitBlocked);
        problem.GetProperty("detail").GetString().Should().Contain("required question");
    }

    [SkippableFact]
    public async Task Get_readiness_with_skipped_must_questions_matches_finalize_career_artifact_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinSkippedMustTransparencyTrailAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("required question");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.CareerArtifact
            && block.Code == CareerArtifactCompletenessValidator.SkippedMustCode);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.GovernancePreCommitBlocked);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_missing_transparency_trail_maps_career_artifact_block_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.ClearIntakeTransparencyTrailAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.GovernancePreCommitBlocked);
        problem.GetProperty("detail").GetString().Should().Contain("transparency trail");
    }

    [SkippableFact]
    public async Task Get_readiness_with_missing_transparency_trail_matches_finalize_career_artifact_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.ClearIntakeTransparencyTrailAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("transparency trail");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Code == CareerArtifactCompletenessValidator.TrailMissingCode);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_degraded_finding_coverage_maps_career_artifact_block_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinWorkingDeskModeForDevUserAsync(Factory);
        await FinalizeConflictSqlIntegrationFixture.PinDegradedFindingCoverageAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.GovernancePreCommitBlocked);
        problem.GetProperty("detail").GetString().Should().Contain("Finding coverage is degraded");
    }

    [SkippableFact]
    public async Task Get_readiness_with_degraded_finding_coverage_matches_finalize_career_artifact_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinWorkingDeskModeForDevUserAsync(Factory);
        await FinalizeConflictSqlIntegrationFixture.PinDegradedFindingCoverageAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("Finding coverage is degraded");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Code == CareerArtifactCompletenessValidator.DegradedFindingCoverageCode);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_provenance_violation_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectDecisionGradeProvenanceViolationAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("decision-grade provenance");
    }

    [SkippableFact]
    public async Task Get_readiness_with_provenance_violation_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.InjectDecisionGradeProvenanceViolationAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("decision-grade provenance");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "decision_grade_provenance");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_existential_assumption_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinExistentialAssumptionOnRequestAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("existential assumption");
    }

    [SkippableFact]
    public async Task Get_readiness_with_existential_assumption_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinExistentialAssumptionOnRequestAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("existential assumption");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "existential_assumption");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_rejected_agent_output_quality_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinRejectedAgentOutputQualityTraceAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("agent output quality gate rejected");
    }

    [SkippableFact]
    public async Task Get_readiness_with_rejected_agent_output_quality_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinRejectedAgentOutputQualityTraceAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("agent output quality gate rejected");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "agent_output_quality");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_evidence_referential_integrity_violation_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinEvidenceReferentialIntegrityViolationAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("finding evidence referential integrity failed");
    }

    [SkippableFact]
    public async Task Get_readiness_with_evidence_referential_integrity_violation_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinEvidenceReferentialIntegrityViolationAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("finding evidence referential integrity failed");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "evidence_referential_integrity");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_structural_execution_mode_mixed_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinStructuralExecutionModeMixedAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("structural execution mode is not decision-grade");
    }

    [SkippableFact]
    public async Task Get_readiness_with_structural_execution_mode_mixed_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinStructuralExecutionModeMixedAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("structural execution mode is not decision-grade");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "structural_execution_mode");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_unsupported_semantic_support_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinUnsupportedSemanticSupportFindingAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("Unsupported semantic support under PilotStrict hold");
    }

    [SkippableFact]
    public async Task Get_readiness_with_unsupported_semantic_support_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinUnsupportedSemanticSupportFindingAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("Unsupported semantic support under PilotStrict hold");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "unsupported_semantic_support");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_architecture_version_pin_drift_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinArchitectureVersionContentHashDriftAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("architecture version content hash");
    }

    [SkippableFact]
    public async Task Get_readiness_with_architecture_version_pin_drift_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinArchitectureVersionContentHashDriftAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("architecture version content hash");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "architecture_version_pin");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_structural_execution_mode_fallback_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinStructuralExecutionModeFallbackAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("structural execution mode is not decision-grade");
    }

    [SkippableFact]
    public async Task Get_readiness_with_structural_execution_mode_fallback_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinStructuralExecutionModeFallbackAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("structural execution mode is not decision-grade");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "structural_execution_mode");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_policy_pack_pin_drift_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinPolicyPackPinHashDriftAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("policy pack pin");
    }

    [SkippableFact]
    public async Task Get_readiness_with_policy_pack_pin_drift_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinPolicyPackPinHashDriftAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("policy pack pin");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "create_time_pin_integrity");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_evidence_package_pin_drift_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinEvidencePackagePinHashDriftAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("evidence package pin");
    }

    [SkippableFact]
    public async Task Get_readiness_with_evidence_package_pin_drift_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinEvidencePackagePinHashDriftAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("evidence package pin");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "create_time_pin_integrity");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    [SkippableFact]
    public async Task Finalize_with_draft_spawn_hash_drift_maps_integrity_conflict_to_409()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinDraftSpawnDocumentHashDriftAsync(Factory, runId);

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("type").GetString().Should().Be(ProblemTypes.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain("draft document content changed after spawn");
    }

    [SkippableFact]
    public async Task Get_readiness_with_draft_spawn_hash_drift_matches_finalize_integrity_block()
    {
        string runId = await CreateExecutedRunIdAsync(TestRequestIds.ForScenario(nameof(FinalizeConflictSqlIntegrationTests)));

        await FinalizeConflictSqlIntegrationFixture.PinDraftSpawnDocumentHashDriftAsync(Factory, runId);

        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        readiness.ReadyToFinalize.Should().BeFalse();
        readiness.BlockedReasonSummary.Should().Contain("draft document content changed after spawn");

        readiness.Blocks.Should().NotBeEmpty();
        readiness.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "create_time_pin_integrity");

        HttpResponseMessage finalizeResponse = await Client.PostFinalizeForTestAsync(Factory, runId);

        JsonElement problem = await finalizeResponse.AssertProblemElementForTestAsync(HttpStatusCode.Conflict);
        problem.GetProperty("detail").GetString().Should().Contain(readiness.BlockedReasonSummary);
    }

    private async Task<string?> TryReadPreCommitReadinessBlockReasonAsync(string runId)
    {
        FinalizeReadinessResult readiness = await Client.GetFinalizeReadinessAsync(runId, JsonOptions);

        foreach (FinalizeReadinessBlock block in readiness.Blocks)
        {
            if (block.Code == "pre_commit_gate"
                && block.Layer == FinalizeReadinessLayers.Governance)
            {
                return block.Message;
            }
        }

        return null;
    }

    private async Task<string> CreateExecutedRunIdAsync(string requestIdPrefix)
    {
        HttpResponseMessage createResponse = await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(requestIdPrefix + Guid.NewGuid().ToString("N")[..8]));


        CreateRunResponseDto created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created.Run.RunId;

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

        GetRunResponseDto runPayload = await getRunResponse.ReadJsonForTestAsync<GetRunResponseDto>(JsonOptions);
        runPayload.Should().NotBeNull();

        string resultsJson = JsonSerializer.Serialize(runPayload.Results, JsonOptions);
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
