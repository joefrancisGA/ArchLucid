using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftIntakeReasoningServiceTests
{
    private readonly ScopeContext _scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task ReasonAsync_CreatesThread_PersistsOnDraft_AndReturnsAnswer()
    {
        Guid draftId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        Guid threadId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        DraftRequestResponse draft = new()
        {
            DraftId = draftId,
            Status = DraftRequestStatus.Drafting,
            Document = new DraftRequestDocument
            {
                FreeTextIntent = "Build a compliance workflow for internal analysts.",
            },
        };

        Mock<IDraftRequestRepository> repository = new();
        repository
            .Setup(static r => r.GetAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(draft);
        repository
            .Setup(r => r.UpdateAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                draftId,
                DraftRequestStatus.Drafting,
                It.IsAny<DraftRequestDocument>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, Guid _, Guid _, Guid _, DraftRequestStatus status, DraftRequestDocument document,
                string? _, string? _, CancellationToken _) =>
                new DraftRequestResponse
                {
                    DraftId = draftId,
                    Status = status,
                    Document = document,
                });

        Mock<IConversationService> conversation = new();
        conversation
            .Setup(static c => c.GetOrCreateThreadAsync(
                null,
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                null,
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ConversationThread
            {
                ThreadId = threadId,
                TenantId = _scope.TenantId,
                WorkspaceId = _scope.WorkspaceId,
                ProjectId = _scope.ProjectId,
            });
        conversation
            .Setup(c => c.GetHistoryAsync(threadId, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        conversation
            .Setup(c => c.AppendUserMessageAsync(threadId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        conversation
            .Setup(c => c.AppendAssistantMessageAsync(
                threadId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAgentCompletionClient> llm = new();
        llm
            .Setup(static c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"answer":"Who are the primary human and machine actors?"}""");

        DraftIntakeReasoningService sut = new(
            repository.Object,
            conversation.Object,
            llm.Object,
            NullLogger<DraftIntakeReasoningService>.Instance);

        DraftIntakeReasonResponse? result = await sut.ReasonAsync(
            draftId,
            new DraftIntakeReasonRequest { Message = "What should I clarify first?" },
            _scope,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.ConversationThreadId.Should().Be(threadId);
        result.Answer.Should().Contain("actors");

        repository.Verify(
            r => r.UpdateAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                draftId,
                DraftRequestStatus.Drafting,
                It.Is<DraftRequestDocument>(document => document.ConversationThreadId == threadId),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ReasonAsync_Throws_WhenDraftStatusDoesNotAllowReasoning()
    {
        Guid draftId = Guid.Parse("66666666-6666-6666-6666-666666666666");

        Mock<IDraftRequestRepository> repository = new();
        repository
            .Setup(r => r.GetAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                draftId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DraftRequestResponse
            {
                DraftId = draftId,
                Status = DraftRequestStatus.RunSpawned,
                Document = new DraftRequestDocument(),
            });

        DraftIntakeReasoningService sut = new(
            repository.Object,
            Mock.Of<IConversationService>(),
            Mock.Of<IAgentCompletionClient>(),
            NullLogger<DraftIntakeReasoningService>.Instance);

        Func<Task> act = () => sut.ReasonAsync(
            draftId,
            new DraftIntakeReasonRequest { Message = "Hello" },
            _scope,
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*does not accept reasoning*");
    }
}
