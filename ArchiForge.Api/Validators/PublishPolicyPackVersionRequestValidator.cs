using ArchiForge.Api.Controllers;
using FluentValidation;

namespace ArchiForge.Api.Validators;

public sealed class PublishPolicyPackVersionRequestValidator : AbstractValidator<PublishPolicyPackVersionRequest>
{
    public PublishPolicyPackVersionRequestValidator()
    {
        RuleFor(x => x.Version)
            .NotEmpty()
            .Must(v => !string.IsNullOrWhiteSpace(v))
            .WithMessage("Version is required.")
            .MaximumLength(50);

        RuleFor(x => x.ContentJson)
            .Must(PolicyPackRequestValidationRules.BeValidJson)
            .WithMessage("ContentJson must be valid JSON.");
    }
}
