using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;

namespace ArchLucid.Application.Clarifications;

public sealed class SecurityCoverageClarificationRule : ReviewClarificationRuleBase
{
    public override string SupportedFindingType => FindingTypes.SecurityCoverageFinding;

    public override IEnumerable<ReviewClarificationQuestion> Derive(Finding finding)
    {
        SecurityCoverageFindingPayload? payload = FindingPayloadConverter.ToSecurityCoveragePayload(finding);

        if (payload is null || payload.UnprotectedResources.Count == 0)
            yield break;

        foreach (string unprotectedResource in payload.UnprotectedResources)
        {
            if (string.IsNullOrWhiteSpace(unprotectedResource))
                continue;

            yield return BuildQuestion(
                finding,
                unprotectedResource.Trim(),
                ReviewClarificationQuestionPromptBuilder.Build(finding.FindingType, unprotectedResource));
        }
    }
}
