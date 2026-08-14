using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class QuickStartAnalyzableEvidenceCompletenessTests
{
    [Theory]
    [InlineData("photo.png", false)]
    [InlineData("network-topology.pdf", true)]
    [InlineData("architecture-brief.md", true)]
    public void Has_analyzable_class_from_pending_file_names(string fileName, bool expectedReady)
    {
        ArchitectureRequest request = BuildQuickStartRequest();
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey] = fileName;
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "0";

        QuickStartAnalyzableEvidenceCompleteness.HasAnalyzableEvidenceClass(request).Should().Be(expectedReady);
    }

    [Fact]
    public void Operator_brief_character_count_unlocks_without_files()
    {
        ArchitectureRequest request = BuildQuickStartRequest();
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "120";

        QuickStartAnalyzableEvidenceCompleteness.HasAnalyzableEvidenceClass(request).Should().BeTrue();
    }

    [Fact]
    public void Limited_evidence_acknowledgment_unlocks_generic_image_only_uploads()
    {
        ArchitectureRequest request = BuildQuickStartRequest();
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey] = "photo.png";
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "0";
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.LimitedEvidenceAnalysisAckKey] =
            QuickStartIntakeMetadataKeys.LimitedEvidenceAnalysisAckValue;

        QuickStartAnalyzableEvidenceCompleteness.HasAnalyzableEvidenceClass(request).Should().BeTrue();
    }

    [Fact]
    public void Limited_evidence_acknowledgment_without_attachments_or_brief_does_not_unlock()
    {
        ArchitectureRequest request = BuildQuickStartRequest();
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "0";
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.LimitedEvidenceAnalysisAckKey] =
            QuickStartIntakeMetadataKeys.LimitedEvidenceAnalysisAckValue;

        QuickStartAnalyzableEvidenceCompleteness.HasAnalyzableEvidenceClass(request).Should().BeFalse();
    }

    [Fact]
    public void Try_collect_failures_adds_validation_failure_for_unanalyzable_quick_start_metadata()
    {
        ArchitectureRequest request = BuildQuickStartRequest();
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey] = "photo.png";
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "0";

        List<FluentValidation.Results.ValidationFailure> failures = [];
        bool hadFailures = QuickStartAnalyzableEvidenceCompleteness.TryCollectFailures(request, failures);

        hadFailures.Should().BeTrue();
        failures.Should().ContainSingle(failure =>
            failure.PropertyName.Contains(QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey, StringComparison.Ordinal));
    }

    private static ArchitectureRequest BuildQuickStartRequest()
    {
        return new ArchitectureRequest
        {
            Description = new string('a', QuickStartAnalyzableEvidenceCompleteness.MinOperatorBriefCharacters),
            SystemName = "Retail API",
            Environment = "staging",
            RequestSource = "wizard",
            WizardPresetUsed = QuickStartWizardPresetValues.QuickReview,
            IntakeQuestionAnswers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
    }
}
