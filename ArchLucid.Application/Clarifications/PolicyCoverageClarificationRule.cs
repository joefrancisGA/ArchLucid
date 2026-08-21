using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;

namespace ArchLucid.Application.Clarifications;

public sealed class PolicyCoverageClarificationRule : ReviewClarificationRuleBase
{
    public override string SupportedFindingType => FindingTypes.PolicyCoverageFinding;

    public override IEnumerable<ReviewClarificationQuestion> Derive(Finding finding)
    {
        PolicyCoverageFindingPayload? payload = FindingPayloadConverter.ToPolicyCoveragePayload(finding);

        if (payload is null || payload.UncoveredResources.Count == 0)
            yield break;

        foreach (string uncoveredResource in payload.UncoveredResources)
        {
            if (string.IsNullOrWhiteSpace(uncoveredResource))
                continue;

            yield return BuildQuestion(
                finding,
                uncoveredResource.Trim(),
                ReviewClarificationQuestionPromptBuilder.Build(finding.FindingType, uncoveredResource));
        }
    }
}
