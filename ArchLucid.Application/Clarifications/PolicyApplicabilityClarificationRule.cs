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

        string? missingItem = string.IsNullOrWhiteSpace(payload.PolicyName)
            ? payload.PolicyReference
            : payload.PolicyName;

        if (string.IsNullOrWhiteSpace(missingItem))
        {
            missingItem = finding.Title?.Trim() ?? string.Empty;
        }

        if (string.IsNullOrWhiteSpace(missingItem))
        {
            yield break;
        }

        string promptItem = missingItem.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || missingItem.Contains("/providers/", StringComparison.OrdinalIgnoreCase)
            ? "Resource name was not stored."
            : missingItem.Trim();
        yield return BuildQuestion(
            finding,
            promptItem,
            ReviewClarificationQuestionPromptBuilder.Build(finding.FindingType, promptItem));
    }
}
