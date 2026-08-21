using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Application.Clarifications;

public sealed class RequiredCapabilityCoverageClarificationRule : ReviewClarificationRuleBase
{
    public override string SupportedFindingType => "RequiredCapabilityCoverageFinding";

    public override IEnumerable<ReviewClarificationQuestion> Derive(Finding finding)
    {
        RequiredCapabilityCoverageFindingPayload? payload =
            FindingPayloadConverter.ConvertPayload<RequiredCapabilityCoverageFindingPayload>(finding);

        if (payload is null || payload.MissingCapabilities.Count == 0)
            yield break;

        foreach (string missingCapability in payload.MissingCapabilities)
        {
            if (string.IsNullOrWhiteSpace(missingCapability))
                continue;

            yield return BuildQuestion(
                finding,
                missingCapability.Trim(),
                ReviewClarificationQuestionPromptBuilder.Build(finding.FindingType, missingCapability));
        }
    }
}
