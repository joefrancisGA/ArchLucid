using ArchLucid.Contracts.Governance;

using FluentValidation;

namespace ArchLucid.Api.Validators;

public sealed class PolicyPackContentDocumentValidator : AbstractValidator<PolicyPackContentDocument>
{
    public PolicyPackContentDocumentValidator()
    {
        RuleFor(x => x.ComplianceRuleIds)
            .Must(ids => ids.TrueForAll(static id => id != Guid.Empty))
            .WithMessage("ComplianceRuleIds must not contain empty GUIDs.");

        RuleForEach(x => x.ComplianceRuleKeys)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.AlertRuleIds)
            .Must(ids => ids.TrueForAll(static id => id != Guid.Empty))
            .WithMessage("AlertRuleIds must not contain empty GUIDs.");

        RuleFor(x => x.CompositeAlertRuleIds)
            .Must(ids => ids.TrueForAll(static id => id != Guid.Empty))
            .WithMessage("CompositeAlertRuleIds must not contain empty GUIDs.");

        RuleFor(x => x.AdvisoryDefaults)
            .Must(static d => d.Keys.All(static k => !string.IsNullOrWhiteSpace(k)))
            .WithMessage("AdvisoryDefaults keys must be non-whitespace.");

        RuleFor(x => x.Metadata)
            .Must(static d => d.Keys.All(static k => !string.IsNullOrWhiteSpace(k)))
            .WithMessage("Metadata keys must be non-whitespace.");
    }
}