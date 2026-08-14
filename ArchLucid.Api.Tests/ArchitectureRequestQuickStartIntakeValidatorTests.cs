using ArchLucid.Api.Validators;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Api")]
public sealed class ArchitectureRequestQuickStartIntakeValidatorTests
{
    private static ArchitectureRequest BuildQuickStartRequest()
    {
        return new ArchitectureRequest
        {
            Description = new string('a', ArchitectureRequestFieldLimits.MinDescriptionLength),
            SystemName = "Retail API",
            Environment = "staging",
            CloudProvider = CloudProvider.Azure,
            RequestSource = "wizard",
            WizardPresetUsed = QuickStartWizardPresetValues.QuickReview,
            IntakeQuestionAnswers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
    }

    private static void SatisfyL0MustSet(ArchitectureRequest request)
    {
        foreach (string mustKey in UniversalIntakeMustQuestionCompleteness.RequiredMustQuestionKeys)
        {
            request.IntakeQuestionAnswers[mustKey] = $"answer-{mustKey}";
        }
    }

    [Fact]
    public async Task Quick_start_create_run_rejects_title_and_evidence_only_payload()
    {
        ArchitectureRequestValidator validator = new();
        ArchitectureRequest request = BuildQuickStartRequest();

        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error =>
            error.PropertyName.StartsWith(nameof(ArchitectureRequest.IntakeQuestionAnswers), StringComparison.Ordinal));
    }

    [Fact]
    public async Task Quick_start_create_run_accepts_fully_answered_l0_must_set()
    {
        ArchitectureRequestValidator validator = new();
        ArchitectureRequest request = BuildQuickStartRequest();

        SatisfyL0MustSet(request);
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "120";

        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Quick_start_create_run_rejects_l0_complete_but_unanalyzable_evidence_only_metadata()
    {
        ArchitectureRequestValidator validator = new();
        ArchitectureRequest request = BuildQuickStartRequest();

        SatisfyL0MustSet(request);
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey] = "photo.png";
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "0";

        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error =>
            error.PropertyName.Contains(QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey, StringComparison.Ordinal));
    }

    [Fact]
    public async Task Quick_start_create_run_accepts_analyzable_pending_file_names_with_l0_complete()
    {
        ArchitectureRequestValidator validator = new();
        ArchitectureRequest request = BuildQuickStartRequest();

        SatisfyL0MustSet(request);
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.PendingEvidenceFileNamesKey] = "network-topology.pdf";
        request.IntakeQuestionAnswers[QuickStartIntakeMetadataKeys.OperatorBriefCharacterCountKey] = "0";

        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeTrue();
    }
}
