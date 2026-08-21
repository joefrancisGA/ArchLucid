using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;

namespace ArchLucid.Application.Clarifications;

public sealed class SecurityBaselineCompletenessClarificationRule : ReviewClarificationRuleBase
{
    public override string SupportedFindingType => FindingTypes.SecurityBaselineCompletenessFinding;

    public override IEnumerable<ReviewClarificationQuestion> Derive(Finding finding)
    {
        SecurityBaselineCompletenessFindingPayload? payload =
            FindingPayloadConverter.ToSecurityBaselineCompletenessPayload(finding);

        if (payload is null || payload.MissingControlFamilies.Count == 0)
            yield break;

        foreach (string missingFamily in payload.MissingControlFamilies)
        {
            if (string.IsNullOrWhiteSpace(missingFamily))
                continue;

            yield return BuildQuestion(
                finding,
                missingFamily.Trim(),
                ReviewClarificationQuestionPromptBuilder.Build(finding.FindingType, missingFamily));
        }
    }
}
