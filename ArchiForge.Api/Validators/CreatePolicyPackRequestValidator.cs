using ArchiForge.Api.Controllers;
using FluentValidation;

namespace ArchiForge.Api.Validators;

public sealed class CreatePolicyPackRequestValidator : AbstractValidator<CreatePolicyPackRequest>
{
    public CreatePolicyPackRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(300);

        RuleFor(x => x.Description)
            .MaximumLength(20_000);

        RuleFor(x => x.PackType)
            .NotEmpty()
            .Must(t => PolicyPackRequestValidationRules.ValidPackTypes.Contains(t))
            .WithMessage(
                "PackType must be one of: BuiltIn, TenantCustom, WorkspaceCustom, ProjectCustom.");

        RuleFor(x => x.InitialContentJson)
            .Must(PolicyPackRequestValidationRules.BeValidJson)
            .WithMessage("InitialContentJson must be valid JSON.");
    }
}
