using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.Ask;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfraEvidenceAskGroundingServiceTests
{
    [Fact]
    public async Task TryAnswerAsync_empty_question_returns_validation_error()
    {
        InfraEvidenceAskGroundingService service = CreateService();

        InfraEvidenceAskGroundingResult result = await service.TryAnswerAsync(
            new ScopeContext(),
            new InfraEvidenceAskRequest { Question = "   " },
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Question");
    }

    [Fact]
    public async Task TryAnswerAsync_no_evidence_returns_insufficient_without_llm()
    {
        Mock<IInfraEvidenceAskEvidenceCollector> collector = new();

        collector
            .Setup(c => c.CollectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<InfraEvidenceAskRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new InfraEvidenceAskEvidenceBundle
            {
                TopicKind = InfraEvidenceAskTopicKinds.ResourceOverview,
            });

        Mock<IAgentCompletionClient> llm = new();

        InfraEvidenceAskGroundingService service = new(
            collector.Object,
            llm.Object,
            Mock.Of<IPromptRedactor>(),
            Mock.Of<IArchitectureDiagramReconciliationRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<InfraEvidenceAskGroundingService>.Instance);

        InfraEvidenceAskGroundingResult result = await service.TryAnswerAsync(
            new ScopeContext(),
            new InfraEvidenceAskRequest { Question = "What changed?" },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Response!.InsufficientEvidence.Should().BeTrue();
        llm.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryAnswerAsync_simulator_citations_are_subset_of_bundle()
    {
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.Drift,
        };

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.ChangeId,
            Guid.NewGuid().ToString("D"),
            "ResourceAdded",
            "change row");

        Mock<IInfraEvidenceAskEvidenceCollector> collector = new();

        collector
            .Setup(c => c.CollectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<InfraEvidenceAskRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(bundle);

        InfraEvidenceAskGroundingService service = new(
            collector.Object,
            Mock.Of<IAgentCompletionClient>(),
            Mock.Of<IPromptRedactor>(),
            Mock.Of<IArchitectureDiagramReconciliationRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<InfraEvidenceAskGroundingService>.Instance);

        InfraEvidenceAskGroundingResult result = await service.TryAnswerAsync(
            new ScopeContext(),
            new InfraEvidenceAskRequest { Question = "Summarize drift", UseSimulator = true },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Response!.SimulatorLabel.Should().Be(InfraEvidenceAskPromptBuilder.SimulatorLabel);
        result.Response.Citations.Should().BeSubsetOf(bundle.Citations);
    }

    [Fact]
    public async Task TryAnswerAsync_llm_path_invokes_redactor()
    {
        Guid changeId = Guid.NewGuid();
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.Drift,
        };

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.ChangeId,
            changeId.ToString("D"),
            "PermissionChanged",
            "change row");

        Mock<IInfraEvidenceAskEvidenceCollector> collector = new();

        collector
            .Setup(c => c.CollectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<InfraEvidenceAskRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(bundle);

        string citationKey = InfraEvidenceAskPromptBuilder.FormatCitationKey(bundle.Citations[0]);

        Mock<IAgentCompletionClient> llm = new();
        llm
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync($"{{\"answer\":\"Grounded answer.\",\"citationIds\":[\"{citationKey}\"]}}");

        Mock<IPromptRedactor> redactor = new();
        redactor
            .Setup(r => r.Redact(It.IsAny<string?>()))
            .Returns((string? input) => new PromptRedactionOutcome(input ?? string.Empty, new Dictionary<string, int>()));

        InfraEvidenceAskGroundingService service = new(
            collector.Object,
            llm.Object,
            redactor.Object,
            Mock.Of<IArchitectureDiagramReconciliationRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<InfraEvidenceAskGroundingService>.Instance);

        InfraEvidenceAskGroundingResult result = await service.TryAnswerAsync(
            new ScopeContext(),
            new InfraEvidenceAskRequest { Question = "What security drift occurred?" },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Response!.Citations.Should().ContainSingle();
        redactor.Verify(r => r.Redact(It.IsAny<string?>()), Times.Once);
    }

    [Fact]
    public void Resolve_diagram_gap_question_maps_to_diagram_gap_topic()
    {
        string topic = InfraEvidenceAskIntentResolver.Resolve(new InfraEvidenceAskRequest
        {
            Question = "Which Azure resources are not in the diagram?",
        });

        topic.Should().Be(InfraEvidenceAskTopicKinds.DiagramGap);
    }

    [Fact]
    public void Resolve_show_identity_diagram_maps_to_diagram_view_topic()
    {
        string topic = InfraEvidenceAskIntentResolver.Resolve(new InfraEvidenceAskRequest
        {
            Question = "Show the identity diagram",
        });

        topic.Should().Be(InfraEvidenceAskTopicKinds.DiagramView);
    }

    [Fact]
    public void Resolve_path_id_wins_over_keyword_topics()
    {
        Guid pathId = Guid.NewGuid();

        InfraEvidenceAskIntentResolver.Resolve(new InfraEvidenceAskRequest
        {
            Question = "Show me this path",
            SecurityEvidencePathId = pathId,
        }).Should().Be(InfraEvidenceAskTopicKinds.RankedPath);

        InfraEvidenceAskIntentResolver.Resolve(new InfraEvidenceAskRequest
        {
            Question = "What changed since baseline?",
            SecurityEvidencePathId = pathId,
        }).Should().Be(InfraEvidenceAskTopicKinds.RankedPath);
    }

    [Fact]
    public void Resolve_ranked_path_without_id_keeps_existing_keyword_behavior()
    {
        InfraEvidenceAskIntentResolver.Resolve(new InfraEvidenceAskRequest
        {
            Question = "Show me the diagram",
        }).Should().Be(InfraEvidenceAskTopicKinds.DiagramView);

        InfraEvidenceAskIntentResolver.Resolve(new InfraEvidenceAskRequest
        {
            Question = "ranked path",
        }).Should().Be(InfraEvidenceAskTopicKinds.ResourceOverview);

        InfraEvidenceAskIntentResolver.Resolve(new InfraEvidenceAskRequest
        {
            Question = "Show me this path",
            SecurityEvidencePathId = Guid.Empty,
        }).Should().Be(InfraEvidenceAskTopicKinds.DiagramView);
    }

    [Fact]
    public void BuildSimulatorViewPlan_identity_question_returns_identity_mode()
    {
        Guid snapshotId = Guid.NewGuid();
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.DiagramView,
        };

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.SnapshotId,
            snapshotId.ToString("D"),
            "subscription",
            $"snapshotId={snapshotId:D}");

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.DiagramViewPlan,
            "identity",
            "identity",
            "allowedMode=identity");

        InfraEvidenceAskRequest request = new()
        {
            Question = "Show the identity diagram",
            SnapshotId = snapshotId,
        };

        DiagramViewPlan? plan = InfraEvidenceAskPromptBuilder.BuildSimulatorViewPlan(
            request.Question,
            request,
            bundle);

        plan.Should().NotBeNull();
        plan!.MermaidMode.Should().Be("identity");
        plan.SnapshotId.Should().Be(snapshotId);
    }

    [Fact]
    public void BuildSimulatorViewPlan_diagram_question_without_mode_keyword_returns_null()
    {
        Guid snapshotId = Guid.NewGuid();
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.DiagramView,
        };

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.SnapshotId,
            snapshotId.ToString("D"),
            "subscription",
            $"snapshotId={snapshotId:D}");

        InfraEvidenceAskRequest request = new()
        {
            Question = "What changed in this subscription last week?",
            SnapshotId = snapshotId,
        };

        DiagramViewPlan? plan = InfraEvidenceAskPromptBuilder.BuildSimulatorViewPlan(
            request.Question,
            request,
            bundle);

        plan.Should().BeNull();
    }

    [Fact]
    public void BuildSimulatorViewPlan_unknown_neighborhood_seed_returns_null()
    {
        Guid snapshotId = Guid.NewGuid();
        InfraEvidenceAskEvidenceBundle bundle = new()
        {
            TopicKind = InfraEvidenceAskTopicKinds.DiagramView,
        };

        bundle.AddCitation(
            InfraEvidenceAskCitationKinds.SnapshotId,
            snapshotId.ToString("D"),
            "subscription",
            $"snapshotId={snapshotId:D}");

        InfraEvidenceAskRequest request = new()
        {
            Question = "Neighborhood of not-a-real-node",
            SnapshotId = snapshotId,
        };

        DiagramViewPlan? plan = InfraEvidenceAskPromptBuilder.BuildSimulatorViewPlan(
            request.Question,
            request,
            bundle);

        plan.Should().BeNull();
    }

    [Fact]
    public async Task TryAnswerAsync_ranked_path_simulator_uses_stored_citations()
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

        Mock<IInfraEvidenceAskEvidenceCollector> collector = new();
        collector
            .Setup(c => c.CollectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<InfraEvidenceAskRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(bundle);

        InfraEvidenceAskGroundingService service = new(
            collector.Object,
            Mock.Of<IAgentCompletionClient>(),
            Mock.Of<IPromptRedactor>(),
            Mock.Of<IArchitectureDiagramReconciliationRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<InfraEvidenceAskGroundingService>.Instance);

        InfraEvidenceAskGroundingResult result = await service.TryAnswerAsync(
            new ScopeContext(),
            new InfraEvidenceAskRequest
            {
                Question = "Explain this ranked path.",
                SecurityEvidencePathId = pathId,
                UseSimulator = true,
            },
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.Response!.TopicKind.Should().Be(InfraEvidenceAskTopicKinds.RankedPath);
        result.Response.SimulatorLabel.Should().Be(InfraEvidenceAskPromptBuilder.SimulatorLabel);
        result.Response.Answer.Should().Contain($"{InfraEvidenceAskCitationKinds.SecurityEvidencePathId}:{pathId:D}");
        result.Response.Answer.Should().NotContain("%");
    }

    [Fact]
    public async Task TryAnswerAsync_ranked_path_rejects_off_bundle_completion()
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

        Mock<IInfraEvidenceAskEvidenceCollector> collector = new();
        collector
            .Setup(c => c.CollectAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<InfraEvidenceAskRequest>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(bundle);

        Mock<IAgentCompletionClient> llm = new();
        llm
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("{\"answer\":\"because\",\"citationIds\":[\"SecurityEvidencePathId:not-in-bundle\"]}");

        Mock<IPromptRedactor> redactor = new();
        redactor
            .Setup(r => r.Redact(It.IsAny<string?>()))
            .Returns((string? input) => new PromptRedactionOutcome(input ?? string.Empty, new Dictionary<string, int>()));

        InfraEvidenceAskGroundingService service = new(
            collector.Object,
            llm.Object,
            redactor.Object,
            Mock.Of<IArchitectureDiagramReconciliationRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<InfraEvidenceAskGroundingService>.Instance);

        InfraEvidenceAskGroundingResult result = await service.TryAnswerAsync(
            new ScopeContext(),
            new InfraEvidenceAskRequest
            {
                Question = "Explain this ranked path.",
                SecurityEvidencePathId = pathId,
            },
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("could not be parsed into a grounded answer");
        llm.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                800,
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static InfraEvidenceAskGroundingService CreateService()
    {
        Mock<IInfraEvidenceAskEvidenceCollector> collector = new();

        return new InfraEvidenceAskGroundingService(
            collector.Object,
            Mock.Of<IAgentCompletionClient>(),
            Mock.Of<IPromptRedactor>(),
            Mock.Of<IArchitectureDiagramReconciliationRepository>(),
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<InfraEvidenceAskGroundingService>.Instance);
    }
}
