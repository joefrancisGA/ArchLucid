using ArchLucid.Contracts.Governance;

using FluentValidation;

namespace ArchLucid.Application.Governance;

/// <summary>
///     FluentValidation rules for <see cref="PolicyPackContentDocument" /> JSON used by the API, CLI, and authoring tools.
/// </summary>
public sealed class PolicyPackContentDocumentValidator : AbstractValidator<PolicyPackContentDocument>
{
    /// <summary>Registers collection and dictionary hygiene rules.</summary>
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

        RuleForEach(x => x.ElicitationQuestions)
            .ChildRules(q =>
            {
                q.RuleFor(x => x.QuestionKey)
                    .NotEmpty()
                    .MaximumLength(200)
                    .WithMessage("ElicitationQuestion.QuestionKey must be non-empty and at most 200 characters.");

                q.RuleFor(x => x.Prompt)
                    .NotEmpty()
                    .MaximumLength(1000)
                    .WithMessage("ElicitationQuestion.Prompt must be non-empty and at most 1 000 characters.");

                q.RuleForEach(x => x.RuleKeys)
                    .NotEmpty()
                    .MaximumLength(500)
                    .WithMessage("ElicitationQuestion.RuleKeys entries must be non-empty and at most 500 characters.");
            });

        RuleFor(x => x)
            .Must(static doc =>
            {
                HashSet<string> packKeys = new(doc.ComplianceRuleKeys, StringComparer.OrdinalIgnoreCase);

                return doc.ElicitationQuestions
                    .SelectMany(static q => q.RuleKeys)
                    .Where(static k => !string.IsNullOrWhiteSpace(k))
                    .All(k => packKeys.Contains(k));
            })
            .WithMessage(
                "ElicitationQuestion.RuleKeys must only reference rule keys present in complianceRuleKeys of the same pack.");
    }
}
