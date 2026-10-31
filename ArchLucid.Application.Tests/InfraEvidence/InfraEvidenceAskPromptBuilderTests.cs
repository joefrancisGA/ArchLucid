using ArchLucid.Application.InfraEvidence.Ask;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class InfraEvidenceAskPromptBuilderTests
{
    [Fact]
    public void BuildUserPrompt_includes_citation_label_honesty_and_bundle_cap_line()
    {
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.Drift,
        };

        for (int index = 0; index < InfraEvidenceAskPromptBuilder.AskEvidenceRowCap; index++)
        {
            bundle.AddCitation(
                InfraEvidenceAskCitationKinds.FindingId,
                Guid.NewGuid().ToString("D"),
                null,
                $"finding row {index}");
        }

        string prompt = InfraEvidenceAskPromptBuilder.BuildUserPrompt(
            "What changed?",
            InfraEvidenceAskTopicKinds.Drift,
            bundle);

        prompt.Should().Contain(
            $"({InfraEvidenceAskCitationHonestyCopy.FindingTitleNotStored})");
        prompt.Should().Contain("bundleCitationCap=50");
    }

    [Fact]
    public void FormatCitationLabelForPrompt_uses_honesty_copy_for_blank_remediation_pattern()
    {
        InfraEvidenceAskCitation citation = new()
        {
            Kind = InfraEvidenceAskCitationKinds.PatternKey,
            Id = "pattern-1",
            Label = "   ",
        };

        InfraEvidenceAskPromptBuilder.FormatCitationLabelForPrompt(citation)
            .Should()
            .Be(InfraEvidenceAskCitationHonestyCopy.RemediationPatternKeyNotStored);
    }
}
