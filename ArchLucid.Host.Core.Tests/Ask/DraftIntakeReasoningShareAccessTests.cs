using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.Application;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DraftIntakeReasoningShareAccessTests
{
    private const string Actor = "jwt:tenant:architect";
    private static readonly Guid DraftId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ArchitectureId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Theory]
    [InlineData(null)]
    [InlineData("api-user")]
    public async Task Missing_identified_execute_actor_stops_before_draft_read(string? actor)
    {
        Harness h = new(actor);
        (await h.ReasonAsync()).Should().BeNull();
        h.Drafts.VerifyNoOtherCalls();
        h.Threads.VerifyNoOtherCalls();
        h.Conversation.VerifyNoOtherCalls();
        h.Llm.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("linked-denied")]
    [InlineData("legacy-other-owner")]
    [InlineData("wrong-scope")]
    [InlineData("prior-denied")]
    [InlineData("invalid-prior")]
    public async Task Unauthorized_draft_or_run_stops_before_thread_and_model(string scenario)
    {
        Harness h = new();
        DraftRequestResponse draft = Draft();
        switch (scenario)
        {
            case "linked-denied":
                draft.ArchitectureId = ArchitectureId;
                h.Access.Setup(a => a.CanDecideArchitectureAsync(Scope, ArchitectureId, CancellationToken.None))
                    .ReturnsAsync(false);
                break;
            case "legacy-other-owner":
                draft.CreatedByUserId = "jwt:tenant:other";
                break;
            case "wrong-scope":
                draft.ProjectId = Guid.NewGuid();
                break;
            case "prior-denied":
                Guid prior = Guid.NewGuid();
                draft.Document.PriorRunId = prior.ToString("N");
                h.Access.Setup(a => a.CanReadRunAsync(Scope, prior, CancellationToken.None)).ReturnsAsync(false);
                break;
            case "invalid-prior":
                draft.Document.PriorRunId = "not-a-run";
                break;
        }
        draft.Document.ConversationThreadId = Guid.NewGuid();
        h.Load(draft);

        (await h.ReasonAsync()).Should().BeNull();
        h.Threads.VerifyNoOtherCalls();
        h.Conversation.VerifyNoOtherCalls();
        h.Llm.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("review")]
    [InlineData("other-scope")]
    [InlineData("missing")]
    [InlineData("legacy")]
    [InlineData("other-draft")]
    [InlineData("other-actor")]
    [InlineData("ordinary-ask")]
    public async Task Unproven_pointer_is_rotated_without_replaying_or_writing_its_history(string kind)
    {
        Harness h = new();
        DraftRequestResponse draft = Draft();
        ConversationThread old = Thread();
        draft.Document.ConversationThreadId = old.ThreadId;
        h.Load(draft);
        if (kind == "review")
            old.RunId = Guid.NewGuid();
        if (kind == "other-scope")
            old.ProjectId = Guid.NewGuid();

        h.Threads.Setup(t => t.GetByIdAsync(old.ThreadId, CancellationToken.None))
            .ReturnsAsync(kind == "missing" ? null : old);
        if (kind is "legacy" or "other-draft" or "other-actor" or "ordinary-ask")
        {
            ConversationMessage[] history = Turn(old, "secret-old-history",
                kind == "other-draft" ? Guid.NewGuid() : DraftId,
                kind == "other-actor" ? "jwt:tenant:other" : Actor,
                null, [], kind == "ordinary-ask", kind == "legacy");
            h.Conversation.Setup(c => c.GetHistoryAsync(old.ThreadId, It.IsAny<int>(), CancellationToken.None))
                .ReturnsAsync(history);
        }

        ConversationThread fresh = Thread();
        h.Bind(draft, fresh);
        h.Complete(fresh);

        DraftIntakeReasonResponse? response = await h.ReasonAsync();

        response.Should().NotBeNull();
        response!.ConversationThreadId.Should().Be(fresh.ThreadId);
        h.Prompt.Should().NotContain("secret-old-history");
        h.Conversation.Verify(c => c.AppendUserMessageAsync(old.ThreadId, It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
        h.Conversation.Verify(c => c.AppendAssistantMessageAsync(old.ThreadId, It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        h.Metadata.Should().Contain("draftIntakeEvidenceScopeV1").And.NotContain("askEvidenceScopeV1");
    }

    [Fact]
    public async Task Authorized_linked_draft_reuses_only_verified_current_actor_and_run_history()
    {
        Harness h = new();
        DraftRequestResponse draft = Draft();
        draft.ArchitectureId = ArchitectureId;
        Guid prior = Guid.NewGuid();
        draft.Document.PriorRunId = prior.ToString("N");
        ConversationThread thread = Thread();
        draft.Document.ConversationThreadId = thread.ThreadId;
        h.Load(draft);
        h.Access.Setup(a => a.CanDecideArchitectureAsync(Scope, ArchitectureId, CancellationToken.None))
            .ReturnsAsync(true);
        h.Access.Setup(a => a.CanReadRunAsync(Scope, prior, CancellationToken.None)).ReturnsAsync(true);
        h.Threads.Setup(t => t.GetByIdAsync(thread.ThreadId, CancellationToken.None)).ReturnsAsync(thread);
        h.Conversation.Setup(c => c.GetHistoryAsync(thread.ThreadId, It.IsAny<int>(), CancellationToken.None))
            .ReturnsAsync(Turn(thread, "verified-answer", DraftId, Actor, ArchitectureId, [prior])
                .Concat(Turn(thread, "revoked-answer", DraftId, Actor, ArchitectureId, [prior, Guid.NewGuid()]))
                .Concat(Turn(thread, "foreign-answer", Guid.NewGuid(), Actor, ArchitectureId, [prior]))
                .Concat(Turn(thread, "ask-answer", DraftId, Actor, ArchitectureId, [prior], ordinaryAsk: true))
                .ToArray());
        h.Complete(thread);

        DraftIntakeReasonResponse? response = await h.ReasonAsync();

        response!.ConversationThreadId.Should().Be(thread.ThreadId);
        h.Prompt.Should().Contain("verified-answer").And.NotContain("revoked-answer")
            .And.NotContain("foreign-answer").And.NotContain("ask-answer");
        h.Drafts.Verify(d => d.TryBindConversationThreadAsync(It.IsAny<DraftRequestResponse>(),
            It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        h.Access.Verify(a => a.CanDecideArchitectureAsync(Scope, ArchitectureId, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Changed_draft_revision_stops_before_conversation_write_or_completion()
    {
        Harness h = new();
        DraftRequestResponse draft = Draft();
        h.Load(draft);
        ConversationThread fresh = Thread();
        h.Conversation.Setup(c => c.GetOrCreateThreadAsync(null, Scope.TenantId, Scope.WorkspaceId,
            Scope.ProjectId, null, null, null, CancellationToken.None)).ReturnsAsync(fresh);
        h.Drafts.Setup(d => d.TryBindConversationThreadAsync(draft, fresh.ThreadId, CancellationToken.None))
            .ReturnsAsync((DraftRequestResponse?)null);

        Func<Task> act = () => h.ReasonAsync();
        await act.Should().ThrowAsync<ConflictException>().WithMessage("*Draft changed*");
        h.Llm.VerifyNoOtherCalls();
        h.Conversation.Verify(c => c.AppendUserMessageAsync(It.IsAny<Guid>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public void Draft_turn_provenance_is_not_ordinary_ask_provenance()
    {
        ConversationThread thread = Thread();
        ConversationMessage[] history = Turn(thread, "draft-only", DraftId, Actor, ArchitectureId, []);
        AskHistoryEvidenceScope.SelectVerifiedDraftTurns(history, thread.ThreadId, DraftId,
            ArchitectureId, Actor, new HashSet<Guid>()).Should().HaveCount(2);
        AskHistoryEvidenceScope.SelectVerifiedTurns(history, thread.ThreadId, Actor,
            new HashSet<Guid>()).Should().BeEmpty();
        AskHistoryEvidenceScope.SelectVerifiedDraftTurns(history, thread.ThreadId, DraftId,
            Guid.NewGuid(), Actor, new HashSet<Guid>()).Should().BeEmpty();
    }

    private static DraftRequestResponse Draft() => new()
    {
        DraftId = DraftId, TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId,
        ProjectId = Scope.ProjectId, CreatedByUserId = Actor, Status = DraftRequestStatus.Drafting,
        Document = new DraftRequestDocument { FreeTextIntent = "A draft" },
    };

    private static ConversationThread Thread() => new()
    {
        ThreadId = Guid.NewGuid(), TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId,
        ProjectId = Scope.ProjectId,
    };

    private static ConversationMessage[] Turn(ConversationThread thread, string answer, Guid draftId,
        string actor, Guid? architectureId, HashSet<Guid> runs, bool ordinaryAsk = false, bool legacy = false)
    {
        string question = "question-" + answer;
        AskHistoryEvidenceScope? proof = legacy ? null : ordinaryAsk
            ? AskHistoryEvidenceScope.Create(thread.ThreadId, actor, runs, question, false)
            : AskHistoryEvidenceScope.CreateForDraft(thread.ThreadId, draftId, architectureId, actor, runs, question);
        string key = ordinaryAsk ? "askEvidenceScopeV1" : "draftIntakeEvidenceScopeV1";
        return
        [
            new ConversationMessage { ThreadId = thread.ThreadId, Role = ConversationMessageRole.User, Content = question },
            new ConversationMessage { ThreadId = thread.ThreadId, Role = ConversationMessageRole.Assistant,
                Content = answer, MetadataJson = JsonSerializer.Serialize(
                    new Dictionary<string, AskHistoryEvidenceScope?> { [key] = proof },
                    new JsonSerializerOptions(JsonSerializerDefaults.Web)) },
        ];
    }

    private sealed class Harness
    {
        public Mock<IDraftRequestRepository> Drafts { get; } = new(MockBehavior.Strict);
        public Mock<IConversationThreadRepository> Threads { get; } = new(MockBehavior.Strict);
        public Mock<IConversationService> Conversation { get; } = new(MockBehavior.Strict);
        public Mock<IAgentCompletionClient> Llm { get; } = new(MockBehavior.Strict);
        public Mock<IAskEvidenceAccess> Access { get; } = new(MockBehavior.Strict);
        public string Prompt { get; private set; } = "";
        public string Metadata { get; private set; } = "";

        public Harness(string? actor = Actor) =>
            Access.Setup(a => a.GetAuthorizedDraftActorId()).Returns(actor);

        public void Load(DraftRequestResponse draft) =>
            Drafts.Setup(d => d.GetAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId, DraftId,
                CancellationToken.None)).ReturnsAsync(draft);

        public void Bind(DraftRequestResponse draft, ConversationThread fresh)
        {
            Conversation.Setup(c => c.GetOrCreateThreadAsync(null, Scope.TenantId, Scope.WorkspaceId,
                Scope.ProjectId, null, null, null, CancellationToken.None)).ReturnsAsync(fresh);
            Drafts.Setup(d => d.TryBindConversationThreadAsync(draft, fresh.ThreadId, CancellationToken.None))
                .ReturnsAsync(() =>
                {
                    draft.Document.ConversationThreadId = fresh.ThreadId;
                    return draft;
                });
        }

        public void Complete(ConversationThread thread)
        {
            Conversation.Setup(c => c.AppendUserMessageAsync(thread.ThreadId, "Next question", CancellationToken.None))
                .Returns(Task.CompletedTask);
            Llm.Setup(l => l.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null,
                    CancellationToken.None))
                .Callback<string, string, int?, float?, CancellationToken>((_, user, _, _, _) => Prompt = user)
                .ReturnsAsync("""{"answer":"ok"}""");
            Conversation.Setup(c => c.AppendAssistantMessageAsync(thread.ThreadId, "ok", It.IsAny<string>(),
                    CancellationToken.None))
                .Callback<Guid, string, string, CancellationToken>((_, _, metadata, _) => Metadata = metadata)
                .Returns(Task.CompletedTask);
        }

        public Task<DraftIntakeReasonResponse?> ReasonAsync() =>
            new DraftIntakeReasoningService(Drafts.Object, Conversation.Object, Llm.Object,
                NullLogger<DraftIntakeReasoningService>.Instance, Access.Object, Threads.Object)
            .ReasonAsync(DraftId, new DraftIntakeReasonRequest { Message = "Next question" }, Scope, CancellationToken.None);
    }
}
