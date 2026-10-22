using ArchLucid.Api.Controllers.Governance;

using FluentValidation;

namespace ArchLucid.Api.Validators;

/// <summary>
///     FluentValidation rules for <see cref="CreatePolicyPackRequest" /> (<c>POST …/policy-packs</c>).
/// </summary>
/// <remarks>
///     Wired in API startup with the other policy pack validators. Failures surface as HTTP 400 with validation problem
///     details.
/// </remarks>
public sealed class CreatePolicyPackRequestValidator : AbstractValidator<CreatePolicyPackRequest>
{
    /// <summary>Registers name/description limits, pack type whitelist, and JSON syntax for initial content.</summary>
    public CreatePolicyPackRequestValidator()
    {
        RuleFor(x => x.Name)
            .Must(PolicyPackRequestValidationRules.BeRequiredTextAfterTrim)
            .WithMessage("Name is required.")
            .Must(name => PolicyPackRequestValidationRules.BeWithinTrimmedMaxLength(
                name,
                PolicyPackRequestValidationRules.PackNameMaxLength))
            .WithMessage(
                $"Name must be at most {PolicyPackRequestValidationRules.PackNameMaxLength} characters.");

        RuleFor(x => x.Description)
            .Must(description => description.Length == 0 || description.Trim().Length > 0)
            .WithMessage("Description cannot be empty or whitespace.")
            .Must(description => PolicyPackRequestValidationRules.BeWithinTrimmedMaxLength(
                description,
                PolicyPackRequestValidationRules.PackDescriptionMaxLength))
            .WithMessage(
                $"Description must be at most {PolicyPackRequestValidationRules.PackDescriptionMaxLength} characters.");

        RuleFor(x => x.PackType)
            .NotEmpty()
            .Must(t => PolicyPackRequestValidationRules.ValidPackTypes.Contains(t))
            .WithMessage(
                "PackType must be one of: TenantCustom, WorkspaceCustom, ProjectCustom.");

        RuleFor(x => x.InitialContentJson)
            .NotEmpty()
            .WithMessage("InitialContentJson is required.")
            .Must(PolicyPackRequestValidationRules.BeValidJson)
            .WithMessage("InitialContentJson must be valid JSON.");
    }
}
