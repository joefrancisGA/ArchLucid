using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;
using ArchLucid.Application.Drafts;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureKnowledgeModelIntakeBuilderTests
{
    private readonly ScopeContext _scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public void Build_maps_structured_intake_fields_to_knowledge_model_elements()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-intake-1",
            SystemName = "Payments Platform",
            Description = "Process card payments with PCI scope controls.",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Private networking required"],
            RequiredCapabilities = ["Audit logging"],
            Assumptions = ["Existing identity provider is Entra ID"],
            QualityAttributeSnapshot = "99.9% availability",
            FailureModeNoteSnapshot = "Queue backlog beyond 15 minutes triggers alert",
            PolicyReferences = ["pack:enterprise-security"],
        };

        ArchitectureKnowledgeModelIntakeBuilder sut = new(new FakeTimeProvider());
        ArchitectureKnowledgeModel model = sut.Build(_scope, request, "abc123run");

        model.ModelId.Should().NotBeNullOrWhiteSpace();
        model.TenantId.Should().Be(_scope.TenantId.ToString("D"));
        model.RunId.Should().Be("abc123run");
        model.Elements.Should().Contain(e =>
            e.Kind == ArchitectureElementKind.Component && e.Name == "Payments Platform");
        model.Elements.Should().Contain(e =>
            e.Kind == ArchitectureElementKind.Constraint && e.Name == "Private networking required");
        model.Elements.Should().Contain(e =>
            e.Kind == ArchitectureElementKind.QualityAttribute && e.Name == "99.9% availability");
        model.Elements.Should().Contain(e =>
            e.Kind == ArchitectureElementKind.ComplianceObligation && e.Name == "pack:enterprise-security");
        model.IsProvisionalSynthesis.Should().BeFalse();
    }

    [Fact]
    public void Build_produces_stable_element_ids_for_identical_inputs()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-intake-2",
            SystemName = "Ledger",
            Description = "Enough characters for description.",
            Constraints = ["Encryption at rest"],
        };

        ArchitectureKnowledgeModelIntakeBuilder sut = new(TimeProvider.System);
        ArchitectureKnowledgeModel first = sut.Build(_scope, request, "run-stable");
        ArchitectureKnowledgeModel second = sut.Build(_scope, request, "run-stable");

        first.Elements.Select(e => e.ElementId).Should().Equal(second.Elements.Select(e => e.ElementId));
    }

    [Fact]
    public void Build_maps_transparency_trail_interview_answers_to_model_elements()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-trail",
            SystemName = "Trail System",
            Description = "Enough characters for description.",
            IntakeTransparencyTrail = new TransparencyTrail
            {
                Asserted =
                [
                    new AssertedTrailEntry { Key = "businessOutcome", Value = "Reduce chargebacks" },
                ],
                Inferred =
                [
                    new InferredTrailEntry { Key = "scale.requestsPerSecond", Value = "1000", Confidence = 60 },
                ],
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

        ArchitectureKnowledgeModelIntakeBuilder sut = new(TimeProvider.System);
        ArchitectureKnowledgeModel model = sut.Build(_scope, request, "run-trail");

        model.FramingAnswers.Should().ContainKey("businessOutcome");
        model.Elements.Should().Contain(e =>
            e.Kind == ArchitectureElementKind.UnresolvedQuestion
            && e.Name == DraftIntakeQuestionKeys.CloudTarget);
        model.Elements.Should().Contain(e =>
            e.Kind == ArchitectureElementKind.Assumption && e.Name == "scale.requestsPerSecond");
        model.IsProvisionalSynthesis.Should().BeTrue();
    }
}
