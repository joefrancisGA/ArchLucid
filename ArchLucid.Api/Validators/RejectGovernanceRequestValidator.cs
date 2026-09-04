using ArchLucid.Api.Models;

using FluentValidation;

namespace ArchLucid.Api.Validators;

public sealed class RejectGovernanceRequestValidator : AbstractValidator<RejectGovernanceRequest>
{
    public RejectGovernanceRequestValidator()
    {
        RuleFor(x => x.ReviewedBy)
            .MaximumLength(200).WithMessage("ReviewedBy must not exceed 200 characters.")
            .When(x => x.ReviewedBy is not null);

        RuleFor(x => x.ReviewComment)
            .MaximumLength(4000).WithMessage("ReviewComment must not exceed 4000 characters.")
            .When(x => x.ReviewComment is not null);
    }
}
