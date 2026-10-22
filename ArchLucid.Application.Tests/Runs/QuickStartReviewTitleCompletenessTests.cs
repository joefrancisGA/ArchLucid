using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class QuickStartReviewTitleCompletenessTests
{
    [Theory]
    [InlineData(QuickStartReviewTitleCompleteness.QualityExample, true)]
    [InlineData("Retail API — retire on-prem gateway", true)]
    [InlineData("Payments platform: move checkout to Azure", true)]
    [InlineData("Retail API", false)]
    [InlineData("Architecture review", false)]
    [InlineData("Test review", false)]
    [InlineData("weekly review", false)]
    [InlineData("", false)]
    public void Accepts_system_plus_decision_titles_only(string title, bool expected)
    {
        QuickStartReviewTitleCompleteness.IsAcceptable(title).Should().Be(expected);
    }

    [Fact]
    public void Try_collect_failures_rejects_placeholder_quick_start_title()
    {
        ArchitectureRequest request = BuildQuickStartRequest("Test review");
        List<FluentValidation.Results.ValidationFailure> failures = [];

        bool hadFailures = QuickStartReviewTitleCompleteness.TryCollectFailures(request, failures);

        hadFailures.Should().BeTrue();
        failures.Should().ContainSingle(failure =>
            failure.PropertyName == nameof(ArchitectureRequest.SystemName));
    }

    [Fact]
    public void Try_collect_failures_accepts_quality_example()
    {
        ArchitectureRequest request = BuildQuickStartRequest(QuickStartReviewTitleCompleteness.QualityExample);
        List<FluentValidation.Results.ValidationFailure> failures = [];

        bool hadFailures = QuickStartReviewTitleCompleteness.TryCollectFailures(request, failures);

        hadFailures.Should().BeFalse();
        failures.Should().BeEmpty();
    }

    [Fact]
    public void Try_collect_failures_accepts_short_title_when_analyzable_evidence_is_pending()
    {
        ArchitectureRequest request = BuildQuickStartRequest("#Al-Lucid");
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey] = "ARCHITECTS_HANDBOOK_202409.docx";
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "0";
        List<FluentValidation.Results.ValidationFailure> failures = [];

        bool hadFailures = QuickStartReviewTitleCompleteness.TryCollectFailures(request, failures);

        hadFailures.Should().BeFalse();
        failures.Should().BeEmpty();
    }

    private static ArchitectureRequest BuildQuickStartRequest(string systemName)
    {
        return new ArchitectureRequest
        {
            Description = new string('a', QuickStartAnalyzableEvidenceCompleteness.MinOperatorBriefCharacters),
            SystemName = systemName,
            Environment = "staging",
            RequestSource = "wizard",
            WizardPresetUsed = QuickStartWizardPresetValues.QuickReview,
            IntakeQuestionAnswers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
    }
}
