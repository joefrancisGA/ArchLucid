using ArchLucid.AgentRuntime;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Comparison;
using ArchLucid.Decisioning.Models;
using ArchLucid.Application.Ask;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Core.Retrieval;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AskServiceComparisonNarrativeTests
{
    [Fact]
    public async Task AskAsync_skips_comparison_narrative_when_config_disabled()
    {
        Guid baseRunId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid targetRunId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        (AskService sut, Mock<IAgentCompletionClient> llm, ScopeContext scope) = CreateSut(
            generateComparisonNarrative: false,
            baseRunId,
            targetRunId,
            includeDecisionDelta: true);

        AskResponse response = await sut.AskAsync(
            new AskRequest
            {
                Question = "Summarize changes",
                BaseRunId = baseRunId,
                TargetRunId = targetRunId,
                RunId = targetRunId,
            },
            scope,
            CancellationToken.None);

        response.ComparisonNarrative.Should().BeNull();
        llm.Verify(
            client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AskAsync_returns_comparison_narrative_when_config_enabled_and_delta_exists()
    {
        Guid baseRunId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid targetRunId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        (AskService sut, Mock<IAgentCompletionClient> llm, ScopeContext scope) = CreateSut(
            generateComparisonNarrative: true,
            baseRunId,
            targetRunId,
            includeDecisionDelta: true);

        llm.SetupSequence(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("Security posture improved; one new cost risk remains.")
            .ReturnsAsync("""
                          {
                            "answer": "Summary ready.",
                            "referencedDecisions": [],
                            "referencedFindings": [],
                            "referencedArtifacts": []
                          }
                          """);

        AskResponse response = await sut.AskAsync(
            new AskRequest
            {
                Question = "Summarize the architectural changes",
                BaseRunId = baseRunId,
                TargetRunId = targetRunId,
                RunId = targetRunId,
            },
            scope,
            CancellationToken.None);

        response.ComparisonNarrative.Should().Be("Security posture improved; one new cost risk remains.");
        llm.Verify(
            client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task AskAsync_omits_comparison_narrative_when_delta_is_empty()
    {
        Guid baseRunId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        Guid targetRunId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        (AskService sut, Mock<IAgentCompletionClient> llm, ScopeContext scope) = CreateSut(
            generateComparisonNarrative: true,
            baseRunId,
            targetRunId,
            includeDecisionDelta: false);

        llm.Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""
                          {
                            "answer": "No material changes.",
                            "referencedDecisions": [],
                            "referencedFindings": [],
                            "referencedArtifacts": []
                          }
                          """);

        AskResponse response = await sut.AskAsync(
            new AskRequest
            {
                Question = "Summarize changes",
                BaseRunId = baseRunId,
                TargetRunId = targetRunId,
                RunId = targetRunId,
            },
            scope,
            CancellationToken.None);

        response.ComparisonNarrative.Should().BeNull();
        llm.Verify(
            client => client.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

    private static (AskService Service, Mock<IAgentCompletionClient> Llm, ScopeContext Scope) CreateSut(
        bool generateComparisonNarrative,
        Guid baseRunId,
        Guid targetRunId,
        bool includeDecisionDelta)
    {
        ScopeContext scope = CreateScope();
        ConversationThread thread = new()
        {
            ThreadId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = targetRunId,
            BaseRunId = baseRunId,
            TargetRunId = targetRunId,
        };

        Mock<IConversationService> conversationService = new();
        conversationService
            .Setup(service => service.GetOrCreateThreadAsync(
                It.IsAny<Guid?>(),
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                It.IsAny<Guid?>(),
                It.IsAny<Guid?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(thread);
        conversationService
            .Setup(service => service.GetHistoryAsync(thread.ThreadId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        conversationService
            .Setup(service => service.AppendUserMessageAsync(thread.ThreadId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        conversationService
            .Setup(service => service.AppendAssistantMessageAsync(
                thread.ThreadId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ManifestDocument baseManifest = CreateManifest(baseRunId);
        ManifestDocument targetManifest = CreateManifest(targetRunId);

        if (includeDecisionDelta)
        {
            targetManifest.Decisions.Add(
                new ResolvedArchitectureDecision
                {
                    DecisionId = "dec-1",
                    Category = "Security",
                    Title = "Ingress",
                    SelectedOption = "Private endpoint",
                });
        }

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailAsync(scope, targetRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRunDetail(targetRunId, targetManifest));
        authority
            .Setup(query => query.GetRunDetailAsync(scope, baseRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRunDetail(baseRunId, baseManifest));

        Mock<IProvenanceQueryService> provenance = new();
        provenance
            .Setup(query => query.GetFullGraphAsync(scope, targetRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GraphViewModel?)null);

        Mock<IAgentCompletionClient> llm = new();

        Mock<IOptionsMonitor<AskComparisonNarrativeOptions>> askOptions = new();
        askOptions
            .Setup(monitor => monitor.CurrentValue)
            .Returns(new AskComparisonNarrativeOptions { GenerateComparisonNarrative = generateComparisonNarrative });

        Mock<IOptionsMonitor<ConversationContextOptions>> contextOptions = new();
        contextOptions.Setup(monitor => monitor.CurrentValue).Returns(new ConversationContextOptions());

        Mock<IOptionsMonitor<AskRetrievalOptions>> askRetrievalOptions = new();
        askRetrievalOptions.Setup(monitor => monitor.CurrentValue).Returns(new AskRetrievalOptions());

        AskService sut = new(
            authority.Object,
            provenance.Object,
            new ComparisonService(),
            llm.Object,
            conversationService.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            Mock.Of<IRetrievalQueryService>(),
            Mock.Of<IRetrievalDocumentBuilder>(),
            Mock.Of<IRetrievalIndexingService>(),
            askOptions.Object,
            Mock.Of<IConversationContextCompressor>(),
            contextOptions.Object,
            askRetrievalOptions.Object,
            NullLogger<AskService>.Instance);

        return (sut, llm, scope);
    }

    private static ManifestDocument CreateManifest(Guid runId) =>
        new()
        {
            RunId = runId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
        };

    private static RunDetailDto CreateRunDetail(Guid runId, ManifestDocument manifest) =>
        new()
        {
            Run = new Persistence.Models.RunRecord { RunId = runId },
            GoldenManifest = manifest,
        };
}
