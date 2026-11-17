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

    [Fact]
    public void RankedPath_prompt_forbids_new_sort_and_numeric_likelihood()
    {
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.RankedPath,
        };

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.SecurityEvidencePathId,
            Guid.NewGuid().ToString("D"),
            "path",
            "path row");

        string userPrompt = InfraEvidenceAskPromptBuilder.BuildUserPrompt(
            "Explain this ranked path.",
            InfraEvidenceAskTopicKinds.RankedPath,
            bundle);

        userPrompt.Should().Contain("Do not return a new composite sort.");
        userPrompt.Should().Contain("Do not return a numeric likelihood or probability.");
        InfraEvidenceAskPromptBuilder
            .BuildSystemPrompt(InfraEvidenceAskTopicKinds.RankedPath)
            .Should()
            .Contain("Do not return a new composite sort.");
    }

    [Fact]
    public void Non_ranked_path_prompt_does_not_add_likelihood_refusal()
    {
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.ResourceOverview,
        };

        InfraEvidenceAskPromptBuilder
            .BuildUserPrompt("What is this?", InfraEvidenceAskTopicKinds.ResourceOverview, bundle)
            .Should()
            .NotContain("Do not return a numeric likelihood or probability.");
    }

    [Fact]
    public void RankedPath_completion_rejects_unknown_or_missing_citations()
    {
        Guid pathId = Guid.NewGuid();
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.RankedPath,
        };
        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.SecurityEvidencePathId,
            pathId.ToString("D"),
            "path",
            "path row");

        InfraEvidenceAskPromptBuilder.TryParseLlmResponse(
                "{\"answer\":\"because\",\"citationIds\":[\"SecurityEvidencePathId:not-in-bundle\"]}",
                bundle,
                out _,
                out _,
                out _)
            .Should()
            .BeFalse();

        InfraEvidenceAskPromptBuilder.TryParseLlmResponse(
                "{\"answer\":\"because\",\"citationIds\":[]}",
                bundle,
                out _,
                out _,
                out _)
            .Should()
            .BeFalse();
    }
}
