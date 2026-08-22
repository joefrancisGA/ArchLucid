using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;

namespace ArchLucid.Application.Clarifications;

public sealed class TopologyCoverageClarificationRule : ReviewClarificationRuleBase
{
    public override string SupportedFindingType => FindingTypes.TopologyCoverageFinding;

    public override IEnumerable<ReviewClarificationQuestion> Derive(Finding finding)
    {
        TopologyCoverageFindingPayload? payload = FindingPayloadConverter.ToTopologyCoveragePayload(finding);

        if (payload is null || payload.MissingCategories.Count == 0)
            yield break;

        foreach (string missingCategory in payload.MissingCategories)
        {
            if (string.IsNullOrWhiteSpace(missingCategory))
                continue;

            yield return BuildQuestion(
                finding,
                missingCategory.Trim(),
                ReviewClarificationQuestionPromptBuilder.Build(finding.FindingType, missingCategory));
        }
    }
}
