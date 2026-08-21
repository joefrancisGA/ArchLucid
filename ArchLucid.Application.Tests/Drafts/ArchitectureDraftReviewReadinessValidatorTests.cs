using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class ArchitectureDraftReviewReadinessValidatorTests
{
    [Fact]
    public void EvaluateBlockers_WhenOnlyUnknownQualityAttribute_ReturnsQualityAttributeBlocker()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.StructuredBrief.ConfirmedConstraints = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview];
        document.StructuredBrief.ConfirmedAssumptions = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview];
        document.StructuredBrief.QualityAttribute = ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview;

        IReadOnlyList<string> blockers = ArchitectureDraftReviewReadinessValidator.EvaluateBlockers(document);

        blockers.Should().NotContain("constraints");
        blockers.Should().NotContain("assumptions");
        blockers.Should().Equal("quality attributes");
    }

    [Fact]
    public void EvaluateBlockers_WhenUnknownSentinelInConstraintsAndAssumptions_ReturnsEmpty()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.StructuredBrief.ConfirmedConstraints = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview];
        document.StructuredBrief.ConfirmedAssumptions = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview];

        ArchitectureDraftReviewReadinessValidator.EvaluateBlockers(document).Should().BeEmpty();
    }

    [Fact]
    public void EnsureReviewReady_DoesNotThrowWhenConstraintsAndAssumptionsAreUnknown()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.StructuredBrief.ConfirmedConstraints = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview];
        document.StructuredBrief.ConfirmedAssumptions = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview];

        Action act = () => ArchitectureDraftReviewReadinessValidator.EnsureReviewReady(document);

        act.Should().NotThrow();
    }

    [Fact]
    public void EvaluateBlockers_WhenLegacyMinimumOnly_ReturnsQualityAttributeBlocker()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.StructuredBrief = new ArchitectureDraftStructuredBrief();

        IReadOnlyList<string> blockers = ArchitectureDraftReviewReadinessValidator.EvaluateBlockers(document);

        blockers.Should().NotContain("constraints");
        blockers.Should().NotContain("assumptions");
        blockers.Should().Equal("quality attributes");
    }

    [Fact]
    public void EvaluateBlockers_WhenQualitativeQualityAttributesOnly_ReturnsEmpty()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.StructuredBrief.QualityAttribute = "defense in depth; zero trust";

        ArchitectureDraftReviewReadinessValidator.EvaluateBlockers(document).Should().BeEmpty();
    }

    [Fact]
    public void EvaluateBlockers_WhenConstraintsAndAssumptionsEmpty_ReturnsEmpty()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.StructuredBrief.ConfirmedConstraints.Clear();
        document.StructuredBrief.ConfirmedAssumptions.Clear();

        ArchitectureDraftReviewReadinessValidator.EvaluateBlockers(document).Should().BeEmpty();
    }

    [Fact]
    public void EvaluateBlockers_WhenStructuredBriefComplete_ReturnsEmpty()
    {
        DraftRequestDocument document = CreateReadyDocument();

        ArchitectureDraftReviewReadinessValidator.EvaluateBlockers(document).Should().BeEmpty();
    }

    [Fact]
    public void EnsureReviewReady_DoesNotThrowWhenConstraintsAreEmpty()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.StructuredBrief.ConfirmedConstraints.Clear();

        Action act = () => ArchitectureDraftReviewReadinessValidator.EnsureReviewReady(document);

        act.Should().NotThrow();
    }

    [Fact]
    public void EnsureReviewReady_ThrowsWhenQualityAttributeMissing()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.StructuredBrief.QualityAttribute = "";

        Action act = () => ArchitectureDraftReviewReadinessValidator.EnsureReviewReady(document);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*quality attributes*");
    }

    [Fact]
    public void EvaluateBlockers_SkipsNonCreateArchitectureWorkflow()
    {
        DraftRequestDocument document = CreateReadyDocument();
        document.WorkflowIntent = ArchitectureWorkflowIntent.StartReview;
        document.StructuredBrief = new ArchitectureDraftStructuredBrief();

        ArchitectureDraftReviewReadinessValidator.EvaluateBlockers(document).Should().BeEmpty();
    }

    private static DraftRequestDocument CreateReadyDocument() => new()
    {
        FreeTextIntent =
            "We are designing a governed workflow platform for analysts with authentication, auditable evidence trails, and exportable architecture reviews.",
        BusinessOutcome = "Reduce cycle time for governed architecture reviews.",
        SystemName = "Claims intake",
        WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
        ActorSet = new ActorSet
        {
            Actors =
            [
                new ActorDescriptor
                {
                    Label = "Primary operator",
                    Kind = ActorKind.Human,
                    TrustOrigin = TrustOrigin.Internal,
                    Contract = InteractionContract.Sync,
                    Origin = ActorOrigin.Asserted,
                    Confidence = 100,
                },
            ],
        },
        StructuredBrief = new ArchitectureDraftStructuredBrief
        {
            ConfirmedConstraints = ["Private endpoints required"],
            ConfirmedAssumptions = ["Team operates in a single region"],
            QualityAttribute = "RTO 4 hours",
        },
    };
}
