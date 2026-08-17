using ArchLucid.AgentRuntime;
using ArchLucid.Application.Ask;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Core.Retrieval;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AskServiceWorkspaceScopedTests
{
    [Fact]
    public async Task AskAsync_without_run_uses_workspace_retrieval_and_returns_answer()
    {
        ScopeContext scope = CreateScope();
        ConversationThread thread = new()
        {
            ThreadId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = null,
        };

        Mock<IConversationService> conversationService = new();
        conversationService
            .Setup(service => service.GetOrCreateThreadAsync(
                It.IsAny<Guid?>(),
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                null,
                null,
                null,
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

        Mock<IRetrievalQueryService> retrieval = new();
        retrieval
            .Setup(query => query.SearchAsync(It.Is<RetrievalQuery>(q => q.RunId == null), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    SourceType = "manifest",
                    Title = "Payments review",
                    Text = "Private endpoint required for data plane.",
                },
            ]);

        Mock<IAgentCompletionClient> llm = new();
        llm.Setup(client => client.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("\"scope\":\"workspace\"", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""
                          {
                            "answer": "Use private endpoints across reviews.",
                            "referencedDecisions": [],
                            "referencedFindings": [],
                            "referencedArtifacts": []
                          }
                          """);

        AskService sut = CreateSut(conversationService, retrieval, llm);

        AskResponse response = await sut.AskAsync(
            new AskRequest { Question = "How do we secure data plane access?" },
            scope,
            CancellationToken.None);

        response.ThreadId.Should().Be(thread.ThreadId);
        response.Answer.Should().Be("Use private endpoints across reviews.");
        retrieval.Verify(
            query => query.SearchAsync(It.Is<RetrievalQuery>(q => q.RunId == null), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AskAsync_without_run_and_with_comparison_ids_throws()
    {
        ScopeContext scope = CreateScope();
        ConversationThread thread = new()
        {
            ThreadId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
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

        AskService sut = CreateSut(conversationService: conversationService);

        Func<Task> act = async () => await sut.AskAsync(
            new AskRequest
            {
                Question = "Compare",
                BaseRunId = Guid.NewGuid(),
                TargetRunId = Guid.NewGuid(),
            },
            scope,
            CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*runId*");
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

    private static AskService CreateSut(
        Mock<IConversationService>? conversationService = null,
        Mock<IRetrievalQueryService>? retrieval = null,
        Mock<IAgentCompletionClient>? llm = null)
    {
        conversationService ??= new Mock<IConversationService>();
        retrieval ??= new Mock<IRetrievalQueryService>();
        llm ??= new Mock<IAgentCompletionClient>();

        Mock<IOptionsMonitor<AskComparisonNarrativeOptions>> askOptions = new();
        askOptions.Setup(monitor => monitor.CurrentValue).Returns(new AskComparisonNarrativeOptions());

        Mock<IOptionsMonitor<ConversationContextOptions>> contextOptions = new();
        contextOptions.Setup(monitor => monitor.CurrentValue).Returns(new ConversationContextOptions());

        Mock<IOptionsMonitor<AskRetrievalOptions>> askRetrievalOptions = new();
        askRetrievalOptions.Setup(monitor => monitor.CurrentValue).Returns(new AskRetrievalOptions());

        return new AskService(
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IProvenanceQueryService>(),
            new ArchLucid.Decisioning.Comparison.ComparisonService(),
            llm.Object,
            conversationService.Object,
            Mock.Of<IFindingInspectReadRepository>(),
            retrieval.Object,
            Mock.Of<IRetrievalDocumentBuilder>(),
            Mock.Of<IRetrievalIndexingService>(),
            askOptions.Object,
            Mock.Of<IConversationContextCompressor>(),
            contextOptions.Object,
            askRetrievalOptions.Object,
            NullLogger<AskService>.Instance);
    }
}
