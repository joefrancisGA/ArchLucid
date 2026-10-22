using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;

using FluentValidation.Results;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IPolicyPackContentAuthoringValidationService" />
public sealed class PolicyPackContentAuthoringValidationService(
    IComplianceRulePackProvider complianceRulePackProvider) : IPolicyPackContentAuthoringValidationService
{
    private readonly IComplianceRulePackProvider _complianceRulePackProvider =
        complianceRulePackProvider ?? throw new ArgumentNullException(nameof(complianceRulePackProvider));

    private readonly PolicyPackContentDocumentValidator _documentValidator = new();

    /// <inheritdoc />
    public async Task<PolicyPackContentValidationResponse> ValidateAsync(
        PolicyPackContentDocument document,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);

        List<PolicyPackContentValidationIssue> issues = [];
        ValidationResult validationResult = _documentValidator.Validate(document);

        foreach (FluentValidation.Results.ValidationFailure failure in validationResult.Errors)
        {
            issues.Add(new PolicyPackContentValidationIssue
            {
                Kind = PolicyPackContentValidationIssueKind.Error,
                Message = failure.ErrorMessage,
                Path = string.IsNullOrWhiteSpace(failure.PropertyName) ? null : failure.PropertyName,
            });
        }

        HashSet<string> knownRuleKeys = await BuildKnownRuleKeySetAsync(document, cancellationToken);

        AppendUnknownRuleKeyWarnings(
            issues,
            document.ComplianceRuleKeys,
            knownRuleKeys,
            "complianceRuleKeys");

        foreach (ElicitationQuestion question in document.ElicitationQuestions)
        {
            AppendUnknownRuleKeyWarnings(
                issues,
                question.RuleKeys,
                knownRuleKeys,
                "elicitationQuestions.ruleKeys");
        }

        PolicyPackContentValidationSummary summary = BuildSummary(document);
        bool valid = issues.All(static issue => issue.Kind != PolicyPackContentValidationIssueKind.Error);

        return new PolicyPackContentValidationResponse
        {
            Valid = valid,
            Summary = summary,
            Issues = issues,
        };
    }

    private async Task<HashSet<string>> BuildKnownRuleKeySetAsync(
        PolicyPackContentDocument document,
        CancellationToken cancellationToken)
    {
        ComplianceRulePack rulePack = await _complianceRulePackProvider.GetRulePackAsync(cancellationToken);

        HashSet<string> knownRuleKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (ComplianceRule rule in rulePack.Rules)
        {
            if (!string.IsNullOrWhiteSpace(rule.RuleId))
                knownRuleKeys.Add(rule.RuleId.Trim());
        }

        foreach (string curatedRuleId in PolicyPackCuratedRuleKeyReader.ReadRuleIdsFromMetadata(document.Metadata))
            knownRuleKeys.Add(curatedRuleId);

        return knownRuleKeys;
    }

    private static void AppendUnknownRuleKeyWarnings(
        List<PolicyPackContentValidationIssue> issues,
        IEnumerable<string> ruleKeys,
        HashSet<string> knownRuleKeys,
        string path)
    {
        foreach (string ruleKey in ruleKeys)
        {
            if (string.IsNullOrWhiteSpace(ruleKey))
                continue;

            string trimmed = ruleKey.Trim();

            if (knownRuleKeys.Contains(trimmed))
                continue;

            issues.Add(new PolicyPackContentValidationIssue
            {
                Kind = PolicyPackContentValidationIssueKind.Warning,
                Path = path,
                Message =
                    $"Unknown complianceRuleKey '{trimmed}' is not in the GA file-based rule library or curated rules in this document.",
            });
        }
    }

    private static PolicyPackContentValidationSummary BuildSummary(PolicyPackContentDocument document) =>
        new()
        {
            ComplianceRuleIdCount = document.ComplianceRuleIds.Count,
            ComplianceRuleKeyCount = document.ComplianceRuleKeys.Count,
            AlertRuleIdCount = document.AlertRuleIds.Count,
            CompositeAlertRuleIdCount = document.CompositeAlertRuleIds.Count,
            AdvisoryDefaultCount = document.AdvisoryDefaults.Count,
            MetadataEntryCount = document.Metadata.Count,
            ElicitationQuestionCount = document.ElicitationQuestions.Count,
        };
}
