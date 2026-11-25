using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Conversation;

namespace ArchLucid.Persistence.Tests.Contracts;
[Trait("Category", "Unit")]

/// <summary>
///     Shared contract assertions for <see cref="IConversationMessageRepository" />.
/// </summary>
public abstract class ConversationMessageRepositoryContractTests
{
    private const int SeededMessagesForThreadTakeContract = 5;
    protected abstract IConversationMessageRepository CreateRepository();

    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    /// <summary>SQL needs a parent thread row before inserting messages.</summary>
    protected virtual Task EnsureThreadExistsAsync(ConversationThread thread)
    {
        return Task.CompletedTask;
    }

    private static ConversationThread NewThreadForMessages()
    {
        return new ConversationThread
        {
            ThreadId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Title = "msg-contract",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            LastUpdatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }

    private static ScopeContext ScopeFor(ConversationThread thread) =>
        new() { TenantId = thread.TenantId, WorkspaceId = thread.WorkspaceId, ProjectId = thread.ProjectId };

    [SkippableFact]
    public async Task Add_then_proof_projection_returns_oldest_first_within_window()
    {
        SkipIfSqlServerUnavailable();
        IConversationMessageRepository repo = CreateRepository();
        ConversationThread thread = NewThreadForMessages();
        await EnsureThreadExistsAsync(thread);

        ConversationMessage first = new()
        {
            MessageId = Guid.NewGuid(),
            ThreadId = thread.ThreadId,
            Role = ConversationMessageRole.User,
            Content = "a",
            CreatedUtc = TimeProvider.System.UtcNowDateTime().AddMinutes(-5)
        };

        ConversationMessage second = new()
        {
            MessageId = Guid.NewGuid(),
            ThreadId = thread.ThreadId,
            Role = ConversationMessageRole.Assistant,
            Content = "b",
            CreatedUtc = TimeProvider.System.UtcNowDateTime().AddMinutes(-4)
        };

        await repo.AddAsync(first, CancellationToken.None);
        await repo.AddAsync(second, CancellationToken.None);

        IReadOnlyList<ConversationProofRow> window =
            await repo.GetRecentProofsAsync(ScopeFor(thread), thread.ThreadId, 10, CancellationToken.None);

        window.Should().HaveCount(2);
        window[0].MessageId.Should().Be(first.MessageId);
        window[1].MessageId.Should().Be(second.MessageId);
    }

    [SkippableFact]
    public async Task Proof_projection_respects_take()
    {
        SkipIfSqlServerUnavailable();
        IConversationMessageRepository repo = CreateRepository();
        ConversationThread thread = NewThreadForMessages();
        await EnsureThreadExistsAsync(thread);

        for (int i = 0; i < SeededMessagesForThreadTakeContract; i++)
        {
            await repo.AddAsync(
                new ConversationMessage
                {
                    MessageId = Guid.NewGuid(),
                    ThreadId = thread.ThreadId,
                    Role = ConversationMessageRole.User,
                    Content = $"m{i}",
                    CreatedUtc = TimeProvider.System.UtcNowDateTime().AddSeconds(-i)
                },
                CancellationToken.None);
        }

        IReadOnlyList<ConversationProofRow> window =
            await repo.GetRecentProofsAsync(ScopeFor(thread), thread.ThreadId, 2, CancellationToken.None);

        window.Should().HaveCount(2);
    }

    [SkippableFact]
    public async Task Proof_projection_and_exact_payload_selection_enforce_thread_and_scope()
    {
        SkipIfSqlServerUnavailable();
        IConversationMessageRepository repo = CreateRepository();
        ConversationThread thread = NewThreadForMessages();
        ConversationThread foreignThread = NewThreadForMessages();
        await EnsureThreadExistsAsync(thread);
        await EnsureThreadExistsAsync(foreignThread);
        ScopeContext scope = new() { TenantId = thread.TenantId, WorkspaceId = thread.WorkspaceId, ProjectId = thread.ProjectId };

        ConversationMessage question = new()
        {
            ThreadId = thread.ThreadId, Role = ConversationMessageRole.User, Content = "stored question",
            MetadataJson = """{"conversationQuestionKeyV1":"question-key","private":"internal-sidecar"}""",
            CreatedUtc = DateTime.UtcNow.AddMinutes(-3),
        };
        ConversationMessage answer = new()
        {
            ThreadId = thread.ThreadId, Role = ConversationMessageRole.Assistant, Content = "stored answer",
            MetadataJson = """{"askEvidenceScopeV1":{"actorKey":"proof"},"draftIntakeEvidenceScopeV1":{"actorKey":"draft-proof"},"private":"internal-sidecar"}""",
            CreatedUtc = DateTime.UtcNow.AddMinutes(-2),
        };
        ConversationMessage invalid = new()
        {
            ThreadId = thread.ThreadId, Role = ConversationMessageRole.Assistant, Content = "unverified",
            MetadataJson = "invalid legacy json", CreatedUtc = DateTime.UtcNow.AddMinutes(-1),
        };
        ConversationMessage foreign = new()
        {
            ThreadId = foreignThread.ThreadId, Role = ConversationMessageRole.User, Content = "different thread",
        };
        foreach (ConversationMessage row in new[] { question, answer, invalid, foreign })
            await repo.AddAsync(row, CancellationToken.None);

        var proofs = await repo.GetRecentProofsAsync(scope, thread.ThreadId, 10, CancellationToken.None);
        proofs.Select(row => row.MessageId).Should().Equal(question.MessageId, answer.MessageId, invalid.MessageId);
        proofs[0].QuestionKey.Should().Be("question-key");
        proofs[0].AnswerProofJson.Should().BeNull();
        proofs[1].AnswerProofJson.Should().Contain("actorKey").And.NotContain("internal-sidecar");
        proofs[1].DraftAnswerProofJson.Should().Contain("draft-proof").And.NotContain("internal-sidecar");
        proofs[2].AnswerProofJson.Should().BeNull();
        proofs[2].DraftAnswerProofJson.Should().BeNull();

        Guid[] requested = [answer.MessageId, foreign.MessageId];
        var payloads = await repo.GetAuthorizedMessagesAsync(scope, thread.ThreadId, requested, CancellationToken.None);
        payloads.Should().ContainSingle().Which.MessageId.Should().Be(answer.MessageId);

        foreach (ScopeContext denied in new[]
                 {
                     new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId },
                     new ScopeContext { TenantId = scope.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = scope.ProjectId },
                     new ScopeContext { TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = Guid.NewGuid() },
                 })
        {
            (await repo.GetRecentProofsAsync(denied, thread.ThreadId, 10, CancellationToken.None)).Should().BeEmpty();
            (await repo.GetAuthorizedMessagesAsync(denied, thread.ThreadId, requested, CancellationToken.None)).Should().BeEmpty();
        }
    }
}
