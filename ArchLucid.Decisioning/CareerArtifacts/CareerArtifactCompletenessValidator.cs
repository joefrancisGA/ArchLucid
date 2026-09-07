using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Decisioning.CareerArtifacts;

/// <summary>Server-side ADR 0078 validator — mirrors <c>evaluateCareerArtifactHonesty()</c> (FC-03).</summary>
public sealed class CareerArtifactCompletenessValidator : ICareerArtifactCompletenessValidator
{
    public const string TrailMissingCode = "transparency_trail_incomplete";
    public const string SkippedMustCode = "skipped_must_questions";
    public const string MeasurementFloorCode = "measurement_floor_incomplete";
    public const string PreCommitGateCode = "pre_commit_gate_disabled";
    public const string QualityGateCode = "quality_gate_incomplete";
    public const string DemoSampleCode = "demo_sample_external_block";
    public const string AssertedEmptyCode = "asserted_trail_empty";
    public const string DecisionGradeProvenanceCode = "decision_grade_provenance";

    public const string FinalizeTrailMissingMessage =
        "Finalize requires a transparency trail with asserted, inferred, and skipped sections. Complete intake provenance or reload the package before sealing.";

    public const string ExportTrailMissingMessage =
        "Career export requires a transparency trail with asserted, inferred, and skipped sections.";

    public const string DemoSampleExternalBlockMessage =
        "Demo or sample data cannot be emailed as production proof without explicit waiver copy.";

    public const string LegacySealedTrailWarning =
        "This sealed record was finalized before transparency trail sections were required — treat exports as incomplete for career use.";

    public const string AssertedTrailEmptyCareerClaimMessage =
        "No asserted intake recorded — do not present this package as evidence-backed.";

    public CareerArtifactCompletenessResult Evaluate(CareerArtifactCompletenessInput input)
    {
        ArgumentNullException.ThrowIfNull(input);

        List<CareerArtifactBlockReason> blockReasons = [];
        List<string> warnings = [];
        List<string> headerLines = [];

        EvaluateTransparencyTrail(input, blockReasons, warnings);
        EvaluateSkippedMust(input, blockReasons);
        EvaluateAssertedEmpty(input, blockReasons, warnings);
        EvaluateMeasurementFloor(input, blockReasons);
        EvaluatePreCommitGate(input, blockReasons);
        EvaluateQualityGate(input, blockReasons);
        EvaluateDemoSampleExternalBlock(input, blockReasons);
        EvaluateDecisionGradeProvenance(input, blockReasons);

        if (input.IsSampleRun && input.ArtifactKind == CareerArtifactKind.Export)
        {
            warnings.Add("Sample workspace — not production customer evidence.");
        }

        AppendMeasurementFloorHeader(input, headerLines);

        bool canRender = blockReasons.Count == 0;

        return new CareerArtifactCompletenessResult(canRender, blockReasons, headerLines, warnings);
    }

    private static void EvaluateTransparencyTrail(
        CareerArtifactCompletenessInput input,
        List<CareerArtifactBlockReason> blockReasons,
        List<string> warnings)
    {
        if (input.ArtifactKind == CareerArtifactKind.Finalize)
        {
            if (input.TransparencyTrail is null)
            {
                blockReasons.Add(new CareerArtifactBlockReason(TrailMissingCode, FinalizeTrailMissingMessage));
            }

            return;
        }

        if (input.TransparencyTrail is null)
        {
            if (input.LegacySealedReExport)
            {
                warnings.Add(LegacySealedTrailWarning);

                return;
            }

            blockReasons.Add(new CareerArtifactBlockReason(TrailMissingCode, ExportTrailMissingMessage));
        }
    }

    private static void EvaluateSkippedMust(
        CareerArtifactCompletenessInput input,
        List<CareerArtifactBlockReason> blockReasons)
    {
        if (input.TransparencyTrail is null)
        {
            return;
        }

        int skippedMustCount = CountSkippedMustQuestions(input.TransparencyTrail);

        if (skippedMustCount <= 0)
        {
            return;
        }

        string message = input.ArtifactKind == CareerArtifactKind.Finalize
            ? FormatSkippedMustBlockedReason(skippedMustCount)
            : "Required intake questions are unanswered — resolve skipped MUST questions before sealing.";

        blockReasons.Add(new CareerArtifactBlockReason(SkippedMustCode, message));
    }

    private static void EvaluateAssertedEmpty(
        CareerArtifactCompletenessInput input,
        List<CareerArtifactBlockReason> blockReasons,
        List<string> warnings)
    {
        if (!input.WorkingDesk || input.TransparencyTrail is null)
        {
            return;
        }

        if (input.TransparencyTrail.Asserted.Count > 0)
        {
            return;
        }

        if (input.ArtifactKind == CareerArtifactKind.Export)
        {
            blockReasons.Add(new CareerArtifactBlockReason(
                AssertedEmptyCode,
                AssertedTrailEmptyCareerClaimMessage));
        }
        else if (input.ArtifactKind == CareerArtifactKind.Finalize)
        {
            warnings.Add(AssertedTrailEmptyCareerClaimMessage);
        }
    }

    private static void EvaluateMeasurementFloor(
        CareerArtifactCompletenessInput input,
        List<CareerArtifactBlockReason> blockReasons)
    {
        if (!input.WorkingDesk)
        {
            return;
        }

        string? blockedReason = InsightDensityMeasurementFloorPresenter.FormatCareerExportBlockedReason(
            input.EnginesSucceeded,
            input.CatalogAdvisoryEngineFailureCount);

        if (blockedReason is not null)
        {
            blockReasons.Add(new CareerArtifactBlockReason(MeasurementFloorCode, blockedReason));
        }
    }

    private static void EvaluatePreCommitGate(
        CareerArtifactCompletenessInput input,
        List<CareerArtifactBlockReason> blockReasons)
    {
        if (!input.WorkingDesk || input.ArtifactKind != CareerArtifactKind.Finalize)
        {
            return;
        }

        if (input.PreCommitGateEnabled)
        {
            return;
        }

        blockReasons.Add(new CareerArtifactBlockReason(
            PreCommitGateCode,
            "Serious findings can still be sealed here. This is not a fully governed review record."));
    }

    private static void EvaluateQualityGate(
        CareerArtifactCompletenessInput input,
        List<CareerArtifactBlockReason> blockReasons)
    {
        if (!input.WorkingDesk || input.ArtifactKind != CareerArtifactKind.Export)
        {
            return;
        }

        string? blockedReason = FormatQualityGateCareerExportBlockedReason(
            input.StructuralExecutionMode,
            input.IsSampleRun,
            input.HostAgentExecutionMode,
            input.HostQualityGateMode,
            input.AggregateQualityGateOutcome);

        if (blockedReason is not null)
        {
            blockReasons.Add(new CareerArtifactBlockReason(QualityGateCode, blockedReason));
        }
    }

    private static void EvaluateDemoSampleExternalBlock(
        CareerArtifactCompletenessInput input,
        List<CareerArtifactBlockReason> blockReasons)
    {
        if (!input.BlockExternalSponsorDistribution || !input.IsSampleRun)
        {
            return;
        }

        blockReasons.Add(new CareerArtifactBlockReason(DemoSampleCode, DemoSampleExternalBlockMessage));
    }

    private static void EvaluateDecisionGradeProvenance(
        CareerArtifactCompletenessInput input,
        List<CareerArtifactBlockReason> blockReasons)
    {
        if (input.ArtifactKind != CareerArtifactKind.Export || !input.WorkingDesk || input.FindingsSnapshot is null)
        {
            return;
        }

        foreach (string violation in DecisionGradeFindingProvenanceValidator.GetViolations(input.FindingsSnapshot))
        {
            blockReasons.Add(new CareerArtifactBlockReason(DecisionGradeProvenanceCode, violation));
        }
    }

    private static void AppendMeasurementFloorHeader(
        CareerArtifactCompletenessInput input,
        List<string> headerLines)
    {
        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(input.EnginesSucceeded);

        if (presentation.Sentence.Trim().Length > 0)
        {
            headerLines.Add(presentation.Sentence.Trim());
        }
    }

    internal static int CountSkippedMustQuestions(TransparencyTrail trail)
    {
        ArgumentNullException.ThrowIfNull(trail);

        return trail.Skipped.Count(skipped =>
            skipped.Tier == ElicitationQuestionTier.Must
            && !string.IsNullOrWhiteSpace(skipped.QuestionKey));
    }

    internal static string FormatSkippedMustBlockedReason(int skippedMustCount) =>
        skippedMustCount == 1
            ? "1 required question is unanswered."
            : $"{skippedMustCount} required questions are unanswered.";

    internal static string? FormatQualityGateCareerExportBlockedReason(
        StructuralExecutionMode structuralExecutionMode,
        bool isSampleRun,
        string? hostAgentExecutionMode,
        AgentOutputQualityGateMode hostQualityGateMode,
        AgentOutputQualityGateOutcome? aggregateQualityGateOutcome)
    {
        if (isSampleRun)
        {
            return null;
        }

        if (structuralExecutionMode != StructuralExecutionMode.Real)
        {
            return null;
        }

        if (aggregateQualityGateOutcome == AgentOutputQualityGateOutcome.Warned)
        {
            return "Quality gate disposition is Warned — resolve warnings before career export";
        }

        bool hostIsReal = string.Equals(hostAgentExecutionMode, "Real", StringComparison.OrdinalIgnoreCase);

        if (hostIsReal && hostQualityGateMode == AgentOutputQualityGateMode.WarnOnly)
        {
            return "Quality gate is WarnOnly — this seal is not career-complete for real-mode analysis";
        }

        return null;
    }
}
