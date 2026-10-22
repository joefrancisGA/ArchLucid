using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class UniversalIntakeAnswerProjectorTests
{
    [Fact]
    public void ApplyToRequest_projects_cloud_target_and_cost_constraint()
    {
        ArchitectureRequest request = new()
        {
            Description = new string('a', ArchitectureRequestFieldLimits.MinDescriptionLength),
            SystemName = "Retail API",
            Environment = "staging",
            IntakeQuestionAnswers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [DraftIntakeQuestionKeys.CloudTarget] = nameof(CloudProvider.Azure),
                ["l0.pillar.cost"] = "Stay under $50k per month",
            },
        };

        UniversalIntakeAnswerProjector.ApplyToRequest(request);

        request.CloudProvider.Should().Be(CloudProvider.Azure);
        request.Constraints.Should().Contain("Cost: Stay under $50k per month");
    }

    [Fact]
    public void ApplyToRequest_uses_unknown_sentinel_for_skipped_cloud_target()
    {
        ArchitectureRequest request = new()
        {
            Description = new string('a', ArchitectureRequestFieldLimits.MinDescriptionLength),
            SystemName = "Retail API",
            Environment = "staging",
            IntakeTransparencyTrail = new TransparencyTrail
            {
                Skipped =
                [
                    new SkippedQuestionTrailEntry
                    {
                        QuestionKey = DraftIntakeQuestionKeys.CloudTarget,
                        Tier = ElicitationQuestionTier.Must,
                    },
                ],
            },
        };

        UniversalIntakeAnswerProjector.ApplyToRequest(request);

        request.CloudProvider.Should().Be(CloudProvider.None);
    }

    [Fact]
    public void ApplyToRequest_does_not_promote_unknown_sentinel_into_inline_requirements()
    {
        ArchitectureRequest request = new()
        {
            Description = new string('a', ArchitectureRequestFieldLimits.MinDescriptionLength),
            SystemName = "Retail API",
            Environment = "staging",
            IntakeQuestionAnswers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["l0.pillar.reliability"] = ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview,
                ["l0.pillar.cost"] = ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview,
            },
        };

        UniversalIntakeAnswerProjector.ApplyToRequest(request);

        request.InlineRequirements.Should().BeEmpty();
        request.Constraints.Should().BeEmpty();
    }

    [Fact]
    public void ApplyToRequest_projects_confirmed_inline_requirement_when_not_unknown()
    {
        ArchitectureRequest request = new()
        {
            Description = new string('a', ArchitectureRequestFieldLimits.MinDescriptionLength),
            SystemName = "Retail API",
            Environment = "staging",
            IntakeQuestionAnswers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["l0.pillar.reliability"] = "RTO 4 hours",
            },
        };

        UniversalIntakeAnswerProjector.ApplyToRequest(request);

        request.InlineRequirements.Should().Contain("Reliability: RTO 4 hours");
    }
}
