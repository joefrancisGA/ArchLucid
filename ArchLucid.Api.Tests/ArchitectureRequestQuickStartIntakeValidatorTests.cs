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
        };
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

        foreach (string mustKey in UniversalIntakeMustQuestionCompleteness.RequiredMustQuestionKeys)
        {
            request.IntakeQuestionAnswers[mustKey] = $"answer-{mustKey}";
        }

        ValidationResult result = await validator.ValidateAsync(request);

        result.IsValid.Should().BeTrue();
    }
}
