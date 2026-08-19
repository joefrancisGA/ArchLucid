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
    public void ApplyToRequest_skips_unknown_sentinel_for_cost_constraint_projection()
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
                        QuestionKey = "l0.pillar.cost",
                        Tier = ElicitationQuestionTier.Must,
                    },
                ],
            },
        };

        UniversalIntakeAnswerProjector.ApplyToRequest(request);

        request.Constraints.Should().BeEmpty();
    }
}
