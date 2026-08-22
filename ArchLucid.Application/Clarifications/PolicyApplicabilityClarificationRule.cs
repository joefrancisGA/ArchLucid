using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;

namespace ArchLucid.Application.Clarifications;

/// <summary>Only surfaces policy applicability gaps when no topology resources are linked yet.</summary>
public sealed class PolicyApplicabilityClarificationRule : ReviewClarificationRuleBase
{
    public override string SupportedFindingType => FindingTypes.PolicyApplicabilityFinding;

    public override IEnumerable<ReviewClarificationQuestion> Derive(Finding finding)
    {
        PolicyApplicabilityFindingPayload? payload = FindingPayloadConverter.ToPolicyApplicabilityPayload(finding);

        if (payload is null || payload.ApplicableTopologyResourceCount != 0)
            yield break;

        string missingItem = string.IsNullOrWhiteSpace(payload.PolicyName)
            ? payload.PolicyReference ?? finding.Title
            : payload.PolicyName;

        if (string.IsNullOrWhiteSpace(missingItem))
            yield break;

        yield return BuildQuestion(
            finding,
            missingItem.Trim(),
            ReviewClarificationQuestionPromptBuilder.Build(finding.FindingType, missingItem));
    }
}
