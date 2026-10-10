using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Documents the finalize/commit gate split so scorecard dimensions are not duplicated across layers.
///     TB-2321 scorecard lives in <see cref="ArchLucid.Application.Runs.Finalization.FinalizeQualityGate" />;
///     career-artifact gates live in the orchestrator; structural/provenance gates live in
///     <c>CommitOutputIntegrityService</c>.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommitOutputIntegrityGateMapArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void CommitOutputIntegrityService_enforces_structural_and_provenance_gates_before_scorecard()
    {
        string integrity = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        integrity.Should().Contain("StructuralExecutionModeCommitGuard.GetBlockingReasons");
        integrity.Should().Contain("AuthorityRunLifecyclePhaseResolver.Resolve");
        integrity.Should().Contain("RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons");
        integrity.Should().Contain("UnsupportedSemanticSupportFinalizeHoldEvaluator.GetBlockingReasons");
        integrity.Should().Contain("DecisionGradeFindingProvenanceValidator.GetViolations");
        integrity.Should().Contain("FinalizeAssumptionGateEvaluator.GetBlockingReasons");
        integrity.Should().Contain("CommitArchitectureVersionPinIntegrityEvaluator.GetBlockingReasonsAsync");
        integrity.Should().Contain("CommitCreateTimePinIntegrityEvaluator.GetBlockingReasonsAsync");
        integrity.Should().Contain("_finalizeQualityGate");
        integrity.Should().Contain("EnsurePassOrThrowAsync");
        integrity.Should().Contain("FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons");
    }

    [Fact]
    public void CommitOutputIntegrityService_runs_semantic_judge_after_blocking_gates_that_must_precede_persist()
    {
        string integrity = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "CommitOutputIntegrityService.cs"));

        int provenance = integrity.IndexOf(
            "DecisionGradeFindingProvenanceValidator.GetViolations",
            StringComparison.Ordinal);
        int assumption = integrity.IndexOf(
            "FinalizeAssumptionGateEvaluator.GetBlockingReasons",
            StringComparison.Ordinal);
        int scorecard = integrity.IndexOf(
            "_finalizeQualityGate\n            .EnsurePassOrThrowAsync",
            StringComparison.Ordinal);
        int judge = integrity.IndexOf(
            "_semanticSupportBandFinalizeJudge\n            .ApplyAsync",
            StringComparison.Ordinal);
        int evidence = integrity.IndexOf(
            "FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons",
            StringComparison.Ordinal);
        int unsupported = integrity.IndexOf(
            "UnsupportedSemanticSupportFinalizeHoldEvaluator.GetBlockingReasons",
            StringComparison.Ordinal);

        provenance.Should().BeGreaterThan(0);
        assumption.Should().BeGreaterThan(provenance);
        scorecard.Should().BeGreaterThan(assumption);
        evidence.Should().BeGreaterThan(scorecard);
        judge.Should().BeGreaterThan(evidence);
        unsupported.Should().BeGreaterThan(judge);
    }

    [Fact]
    public void FinalizeQualityScorecard_evaluator_counts_ten_ui_parity_dimensions()
    {
        string evaluator = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Finalization",
                "FinalizeQualityScorecardEvaluator.cs"));

        evaluator.Should().Contain("IsCoverageGapJobView");
        evaluator.Should().Contain("IsOpenRequiredCapabilityCoverageJobView");
        evaluator.Should().Contain("IsOpenDeferredJobView");
        evaluator.Should().Contain("IsOpenContradictionJobView");
        evaluator.Should().Contain("IsOpenCannotDetermineJobView");
        evaluator.Should().Contain("IsOpenVerifyHypothesisJobView");
        evaluator.Should().Contain("BlockingFindingCount");
        evaluator.Should().Contain("FinalizeAssumptionGateEvaluator.CollectOpenAssumptions");
        evaluator.Should().Contain("LowExtractionConfidenceCount");
        evaluator.Should().Contain("UnresolvedHighSeverityDispositionCount");
        evaluator.Should().Contain("MissingRequiredCapabilityCount");
    }

    [Fact]
    public void Orchestrator_enforces_career_artifact_gates_outside_scorecard()
    {
        string orchestrator = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "AuthorityDrivenArchitectureRunCommitOrchestrator.cs"));

        orchestrator.Should().Contain("CareerArtifactCompletenessValidator");
        orchestrator.Should().Contain("MapForFinalize");
        orchestrator.Should().NotContain("IsOpenVerifyHypothesisJobView");
    }

    [Fact]
    public void FinalizeReadinessService_reuses_commit_gate_evaluators()
    {
        string readiness = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "FinalizeReadinessService.cs"));

        readiness.Should().Contain("CareerArtifactCompletenessValidator");
        readiness.Should().Contain("StructuralExecutionModeCommitGuard.GetBlockingReasons");
        readiness.Should().Contain("AuthorityRunLifecyclePhaseResolver.Resolve");
        readiness.Should().Contain("FinalizeAssumptionGateEvaluator.GetBlockingReasons");
        readiness.Should().Contain("FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons");
        readiness.Should().Contain("FinalizeQualityScorecardEvaluator.Compute");
        readiness.Should().Contain("FinalizeQualityScorecardEvaluator.GetBlockingReasons");
        readiness.Should().Contain("CommitArchitectureVersionPinIntegrityEvaluator.GetBlockingReasonsAsync");
        readiness.Should().Contain("CommitCreateTimePinIntegrityEvaluator.GetBlockingReasonsAsync");
        readiness.Should().Contain("AppendPreScorecardIntegrityBlocksAsync");
        readiness.Should().Contain("AppendEvidenceReferentialIntegrityBlock");
        readiness.Should().Contain("IPreCommitGovernanceGate");
        readiness.Should().Contain("pre_commit_gate");
    }

    [Fact]
    public void Ui_scorecard_derives_verify_hypothesis_from_job_view_classifier()
    {
        string derive = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "review-quality",
                "finalize-quality-scorecard-from-findings.ts"));

        derive.Should().Contain("verify-hypotheses");
        derive.Should().Contain("resolve-contradictions");
        derive.Should().Contain("openDeferredCount");
        derive.Should().Contain("openContradictionCount");
        derive.Should().Contain("isUnresolvedBlockingReviewFinding");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
