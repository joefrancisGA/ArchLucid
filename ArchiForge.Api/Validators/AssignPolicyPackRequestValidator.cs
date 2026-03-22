using ArchiForge.Api.Controllers;
using FluentValidation;

namespace ArchiForge.Api.Validators;

public sealed class AssignPolicyPackRequestValidator : AbstractValidator<AssignPolicyPackRequest>
{
    public AssignPolicyPackRequestValidator()
    {
        RuleFor(x => x.Version)
            .NotEmpty()
            .Must(v => !string.IsNullOrWhiteSpace(v))
            .WithMessage("Version is required.")
            .MaximumLength(50);
    }
}
