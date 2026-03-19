using ArchiForge.Contracts.Requests;
using FluentValidation;

namespace ArchiForge.Api.Validators;

public sealed class ArchitectureRequestValidator : AbstractValidator<ArchitectureRequest>
{
    public ArchitectureRequestValidator()
    {
        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("RequestId is required.")
            .MaximumLength(64).WithMessage("RequestId must not exceed 64 characters.");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MinimumLength(10).WithMessage("Description must be at least 10 characters.")
            .MaximumLength(4000).WithMessage("Description must not exceed 4000 characters.");

        RuleFor(x => x.SystemName)
            .NotEmpty().WithMessage("SystemName is required.")
            .MaximumLength(200).WithMessage("SystemName must not exceed 200 characters.");

        RuleFor(x => x.Environment)
            .NotEmpty().WithMessage("Environment is required.")
            .MaximumLength(50).WithMessage("Environment must not exceed 50 characters.");

        RuleFor(x => x.CloudProvider)
            .IsInEnum().WithMessage("CloudProvider must be a valid value.");

        RuleFor(x => x.Constraints)
            .NotNull().WithMessage("Constraints must not be null.")
            .Must(c => c.Count <= 50).WithMessage("Constraints must not exceed 50 items.");

        RuleFor(x => x.RequiredCapabilities)
            .NotNull().WithMessage("RequiredCapabilities must not be null.")
            .Must(c => c.Count <= 50).WithMessage("RequiredCapabilities must not exceed 50 items.");

        RuleFor(x => x.Assumptions)
            .NotNull().WithMessage("Assumptions must not be null.")
            .Must(c => c.Count <= 50).WithMessage("Assumptions must not exceed 50 items.");
    }
}
