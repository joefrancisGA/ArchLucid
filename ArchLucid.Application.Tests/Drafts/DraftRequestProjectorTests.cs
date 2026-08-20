using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class DraftRequestProjectorTests
{
    private readonly DraftRequestProjector _projector = new();

    [Theory]
    [InlineData("Azure", CloudProvider.Azure)]
    [InlineData("Aws", CloudProvider.Aws)]
    [InlineData("Gcp", CloudProvider.Gcp)]
    [InlineData("None", CloudProvider.None)]
    public void Project_MapsCloudTargetAnswer_ToCloudProvider(string answer, CloudProvider expected)
    {
        DraftRequestDocument document = CreateDocument();
        document.QuestionAnswers[DraftIntakeQuestionKeys.CloudTarget] = answer;

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.CloudProvider.Should().Be(expected);
    }

    [Fact]
    public void Project_WhenCloudTargetMissing_UsesNone()
    {
        DraftRequestDocument document = CreateDocument();

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.CloudProvider.Should().Be(CloudProvider.None);
    }

    [Fact]
    public void Project_SetsDraftIntakeRequestSourceAndPreservesTransparencyTrail()
    {
        DraftRequestDocument document = CreateDocument();
        document.TransparencyTrail.Inferred.Add(new InferredTrailEntry
        {
            Key = "scale.requestsPerSecond",
            Value = "1200",
            Confidence = 45,
        });

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.RequestSource.Should().Be("draft-intake");
        request.IntakeTransparencyTrail.Should().NotBeNull();
        request.IntakeTransparencyTrail!.Inferred.Should().ContainSingle(i => i.Key == "scale.requestsPerSecond");
        request.Assumptions.Should().Contain(a => a.Contains("inferred:45", StringComparison.Ordinal));
    }

    [Fact]
    public void Project_CopiesWorkflowIntentOntoArchitectureRequest()
    {
        DraftRequestDocument document = CreateDocument();
        document.WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture;

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.WorkflowIntent.Should().Be(ArchitectureWorkflowIntent.CreateArchitecture);
    }

    [Fact]
    public void Project_WhenCloudTargetMalformed_UsesNoneWithoutThrowing()
    {
        DraftRequestDocument document = CreateDocument();
        document.QuestionAnswers[DraftIntakeQuestionKeys.CloudTarget] = "legacy-free-text-aws";

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.CloudProvider.Should().Be(CloudProvider.None);
    }

    [Fact]
    public void Project_ExcludesUnknownSentinelFromArchitectureRequestLists()
    {
        DraftRequestDocument document = CreateDocument();
        document.WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture;
        document.StructuredBrief = new ArchitectureDraftStructuredBrief
        {
            ConfirmedConstraints = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview],
            ConfirmedAssumptions = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview],
            ConfirmedRequiredCapabilities = [ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview],
            QualityAttribute = ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview,
            FailureModeNote = ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview,
            OperationalOwner = ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview,
        };

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.Constraints.Should().BeEmpty();
        request.RequiredCapabilities.Should().BeEmpty();
        request.Assumptions.Should().NotContain(a => a.Contains(ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview, StringComparison.Ordinal));
        request.InlineRequirements.Should().BeEmpty();
    }

    [Fact]
    public void Project_CopiesStructuredBriefOntoArchitectureRequest()
    {
        DraftRequestDocument document = CreateDocument();
        document.WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture;
        document.StructuredBrief = new ArchitectureDraftStructuredBrief
        {
            ConfirmedConstraints = ["EU data residency"],
            ConfirmedAssumptions = ["Team has landing zone access"],
            ConfirmedRequiredCapabilities = ["Managed identity"],
            QualityAttribute = "RTO 4h",
            FailureModeNote = "Queue backlog delays intake",
            OperationalOwner = "Platform operations",
        };

        Contracts.Requests.ArchitectureRequest request = _projector.Project(document, Guid.NewGuid());

        request.Constraints.Should().ContainSingle("EU data residency");
        request.RequiredCapabilities.Should().ContainSingle("Managed identity");
        request.Assumptions.Should().Contain(a => a.Contains("Team has landing zone access", StringComparison.Ordinal));
        request.InlineRequirements.Should().Contain("Quality attribute: RTO 4h");
        request.InlineRequirements.Should().Contain("Failure mode and recovery: Queue backlog delays intake");
        request.InlineRequirements.Should().Contain("Operational owner: Platform operations");
    }

    private static DraftRequestDocument CreateDocument() => new()
    {
        FreeTextIntent = "Modernize the claims intake workflow with nightly batch API integration.",
    };
}
