using ArchLucid.Api.Models;
using ArchLucid.Contracts.Governance;

using FluentValidation;

namespace ArchLucid.Api.Validators;

public sealed class CreateGovernancePromotionRequestValidator : AbstractValidator<CreateGovernancePromotionRequest>
{
    public CreateGovernancePromotionRequestValidator()
    {
        RuleFor(x => x.RunId)
            .NotEmpty().WithMessage("RunId is required.")
            .MaximumLength(64).WithMessage("RunId must not exceed 64 characters.");

        RuleFor(x => x.ManifestVersion)
            .NotEmpty().WithMessage("ManifestVersion is required.")
            .MaximumLength(128).WithMessage("ManifestVersion must not exceed 128 characters.");

        RuleFor(x => x.SourceEnvironment)
            .NotEmpty().WithMessage("SourceEnvironment is required.")
            .MaximumLength(GovernanceEnvironmentSlug.MaxLength)
            .WithMessage($"SourceEnvironment must not exceed {GovernanceEnvironmentSlug.MaxLength} characters.");

        RuleFor(x => x.TargetEnvironment)
            .NotEmpty().WithMessage("TargetEnvironment is required.")
            .MaximumLength(GovernanceEnvironmentSlug.MaxLength)
            .WithMessage($"TargetEnvironment must not exceed {GovernanceEnvironmentSlug.MaxLength} characters.");

        RuleFor(x => x)
            .Must(x => !string.Equals(x.SourceEnvironment, x.TargetEnvironment, StringComparison.OrdinalIgnoreCase))
            .WithMessage("SourceEnvironment and TargetEnvironment must be different.")
            .When(x => !string.IsNullOrEmpty(x.SourceEnvironment) && !string.IsNullOrEmpty(x.TargetEnvironment));

        RuleFor(x => x.PromotedBy)
            .MaximumLength(200).WithMessage("PromotedBy must not exceed 200 characters.")
            .When(x => x.PromotedBy is not null);

        RuleFor(x => x.Notes)
            .MaximumLength(4000).WithMessage("Notes must not exceed 4000 characters.")
            .When(x => x.Notes is not null);
    }
}
