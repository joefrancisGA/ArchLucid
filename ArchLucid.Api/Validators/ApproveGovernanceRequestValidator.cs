using ArchLucid.Api.Models;

using FluentValidation;

namespace ArchLucid.Api.Validators;

public sealed class ApproveGovernanceRequestValidator : AbstractValidator<ApproveGovernanceRequest>
{
    public ApproveGovernanceRequestValidator()
    {
        RuleFor(x => x.ReviewedBy)
            .MaximumLength(200).WithMessage("ReviewedBy must not exceed 200 characters.")
            .When(x => x.ReviewedBy is not null);

        RuleFor(x => x.ReviewComment)
            .MaximumLength(4000).WithMessage("ReviewComment must not exceed 4000 characters.")
            .When(x => x.ReviewComment is not null);
    }
}
