using ArchLucid.Api.Models;
using ArchLucid.Contracts.Governance;

using FluentValidation;

namespace ArchLucid.Api.Validators;

public sealed class CreateGovernanceApprovalRequestValidator : AbstractValidator<CreateGovernanceApprovalRequest>
{
    public CreateGovernanceApprovalRequestValidator()
    {
        RuleFor(x => x.RunId)
            .NotEmpty().WithMessage("RunId is required.")
            .MaximumLength(64).WithMessage("RunId must not exceed 64 characters.");

        RuleFor(x => x.ManifestVersion)
            .NotEmpty().WithMessage("ManifestVersion is required.")
            .MaximumLength(128).WithMessage("ManifestVersion must not exceed 128 characters.");

        RuleFor(x => x.SourceEnvironment)
            .NotEmpty().WithMessage("SourceEnvironment is required.")
            .MaximumLength(64).WithMessage("SourceEnvironment must not exceed 64 characters.");

        RuleFor(x => x.TargetEnvironment)
            .NotEmpty().WithMessage("TargetEnvironment is required.")
            .MaximumLength(64).WithMessage("TargetEnvironment must not exceed 64 characters.");

        RuleFor(x => x)
            .Must(x => !string.Equals(x.SourceEnvironment, x.TargetEnvironment, StringComparison.OrdinalIgnoreCase))
            .WithMessage("SourceEnvironment and TargetEnvironment must be different.")
            .When(x => !string.IsNullOrEmpty(x.SourceEnvironment) && !string.IsNullOrEmpty(x.TargetEnvironment));

        RuleFor(x => x.RequestComment)
            .MaximumLength(4000).WithMessage("RequestComment must not exceed 4000 characters.")
            .When(x => x.RequestComment is not null);
    }
}
