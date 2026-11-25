using System.Text.Json;

using ArchLucid.AgentRuntime;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using FluentAssertions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AskServiceShareAccessTests
{
    private const string Actor = "jwt:tenant:reader";
    private static readonly Guid A = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid B = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Explicit_denial_precedes_thread_creation_and_completion(bool streaming)
    {
        Mock<IAskEvidenceAccess> access = Access();
        access.Setup(a => a.CanReadRunAsync(Scope, B, CancellationToken.None)).ReturnsAsync(false);
        AskService service = CreateStrictService(access.Object);
        AskRequest request = new() { Question = "Explain", RunId = B };

        Func<Task> act = streaming
            ? () => service.AskStreamAsync(request, Scope, (_, _) => throw new InvalidOperationException("No stream allowed"), CancellationToken.None)
            : () => service.AskAsync(request, Scope, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not available*");
    }

    [Fact]
    public async Task Unconfigured_host_fails_before_any_thread_access()
    {
        AskService service = CreateStrictService(new DenyUnconfiguredAskEvidenceAccess());
        Func<Task> act = () => service.AskAsync(new AskRequest { Question = "Explain" }, Scope, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not available*");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Stored_anchor_denial_precedes_history_even_when_request_supplies_another_run(bool overrideRun)
    {
        ConversationThread thread = Thread(B);
        Mock<IConversationService> conversation = new(MockBehavior.Strict);
        conversation.Setup(c => c.GetOrCreateThreadAsync(thread.ThreadId, Scope.TenantId, Scope.WorkspaceId,
                Scope.ProjectId, overrideRun ? A : null, null, null, CancellationToken.None))
            .ReturnsAsync(thread);
        Mock<IAskEvidenceAccess> access = Access();
        if (overrideRun)
            access.Setup(a => a.CanReadRunAsync(Scope, A, CancellationToken.None)).ReturnsAsync(true);
        access.Setup(a => a.CanReadRunAsync(Scope, B, CancellationToken.None)).ReturnsAsync(false);
        AskService service = CreateStrictService(access.Object, conversation: conversation.Object);

        Func<Task> act = () => service.AskAsync(new AskRequest
        {
            ThreadId = thread.ThreadId, RunId = overrideRun ? A : null, Question = "Explain",
        }, Scope, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not available*");
        conversation.Verify(c => c.GetOrCreateThreadAsync(thread.ThreadId, Scope.TenantId, Scope.WorkspaceId,
            Scope.ProjectId, overrideRun ? A : null, null, null, CancellationToken.None), Times.Once);
        conversation.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Existing_comparison_thread_checks_inherited_target_before_history()
    {
        ConversationThread thread = Thread(A);
        thread.BaseRunId = A;
        thread.TargetRunId = B;
        Mock<IConversationService> conversation = new(MockBehavior.Strict);
        conversation.Setup(c => c.GetOrCreateThreadAsync(thread.ThreadId, Scope.TenantId, Scope.WorkspaceId,
            Scope.ProjectId, null, null, null, CancellationToken.None)).ReturnsAsync(thread);
        Mock<IAskEvidenceAccess> access = Access();
        access.Setup(a => a.CanReadRunAsync(Scope, A, CancellationToken.None)).ReturnsAsync(true);
        access.Setup(a => a.CanReadRunAsync(Scope, B, CancellationToken.None)).ReturnsAsync(false);
        AskService service = CreateStrictService(access.Object, conversation: conversation.Object);

        Func<Task> act = () => service.AskAsync(
            new AskRequest { ThreadId = thread.ThreadId, Question = "Compare" }, Scope, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not available*");
    }

    [Fact]
    public async Task Workspace_retrieval_and_history_receive_the_same_authorized_runs()
    {
        ConversationThread thread = Thread(null);
        Mock<IConversationService> conversation = new();
        conversation.Setup(c => c.GetOrCreateThreadAsync(null, Scope.TenantId, Scope.WorkspaceId,
            Scope.ProjectId, null, null, null, CancellationToken.None)).ReturnsAsync(thread);
        conversation.Setup(c => c.GetVerifiedAskHistoryAsync(Scope, thread.ThreadId, It.IsAny<int>(), Actor,
            It.Is<IReadOnlySet<Guid>>(ids => ids.SetEquals(new[] { A })), CancellationToken.None))
            .ReturnsAsync([]);

        Mock<IAskEvidenceAccess> access = Access();
        access.Setup(a => a.CanReadRunAsync(Scope, A, CancellationToken.None)).ReturnsAsync(true);
        access.Setup(a => a.CanReadRunAsync(Scope, B, CancellationToken.None)).ReturnsAsync(false);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        runs.Setup(r => r.ListRecentInScopeKeysetAsync(Scope, null, null, RunPagination.MaxTake, CancellationToken.None))
            .ReturnsAsync(new RunListPage([new RunRecord { RunId = A }, new RunRecord { RunId = B }], false));
        Mock<IRetrievalQueryService> retrieval = new(MockBehavior.Strict);
        retrieval.Setup(r => r.SearchAsync(It.Is<RetrievalQuery>(q =>
            q.AuthorizedEvidenceRunIds != null && q.AuthorizedEvidenceRunIds.SetEquals(new[] { A })), CancellationToken.None))
            .ReturnsAsync(Array.Empty<RetrievalHit>());
        Mock<IAgentCompletionClient> llm = new();
        string? prompt = null;
        llm.Setup(l => l.CompleteJsonAsync(It.IsAny<string>(), It.IsAny<string>(), null, null, CancellationToken.None))
            .Callback<string, string, int?, float?, CancellationToken>((_, user, _, _, _) => prompt = user)
            .ReturnsAsync("""{"answer":"ok"}""");

        AskService service = AskServiceTestFactory.Create(llm: llm.Object, conversationService: conversation.Object,
            retrievalQuery: retrieval.Object, runRepository: runs.Object, evidenceAccess: access.Object);
        AskResponse result = await service.AskAsync(new AskRequest { Question = "Explain" }, Scope, CancellationToken.None);

        result.Answer.Should().NotBeNullOrEmpty();
        prompt.Should().NotBeNull();
        conversation.Verify(c => c.GetVerifiedAskHistoryAsync(Scope, thread.ThreadId, It.IsAny<int>(), Actor,
            It.Is<IReadOnlySet<Guid>>(ids => ids.SetEquals(new[] { A })), CancellationToken.None), Times.Once);
        retrieval.Verify(r => r.SearchAsync(It.Is<RetrievalQuery>(q =>
            q.AuthorizedEvidenceRunIds != null && q.AuthorizedEvidenceRunIds.SetEquals(new[] { A })), CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Finding_denial_only_reads_owner_identity()
    {
        Guid finding = Guid.NewGuid();
        Mock<IFindingInspectReadRepository> findings = new(MockBehavior.Strict);
        findings.Setup(f => f.GetRunIdByFindingIdAsync(Scope, finding.ToString("N"), CancellationToken.None))
            .ReturnsAsync((Guid?)B);
        Mock<IAskEvidenceAccess> access = Access();
        access.Setup(a => a.CanReadRunAsync(Scope, B, CancellationToken.None)).ReturnsAsync(false);
        AskService service = CreateStrictService(access.Object, findings: findings.Object);

        Func<Task> act = () => service.AskAboutFindingAsync(new FindingAskRequest
        {
            FindingId = finding, Question = "Explain",
        }, Scope, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not available*");
        findings.Verify(f => f.GetRunIdByFindingIdAsync(Scope, finding.ToString("N"), CancellationToken.None), Times.Once);
        findings.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Finding_owner_mismatch_stops_before_history_and_completion()
    {
        Guid finding = Guid.NewGuid();
        Mock<IFindingInspectReadRepository> findings = new(MockBehavior.Strict);
        findings.Setup(f => f.GetRunIdByFindingIdAsync(Scope, finding.ToString("N"), CancellationToken.None))
            .ReturnsAsync((Guid?)A);
        findings.Setup(f => f.GetInspectAsync(Scope, finding.ToString("N"), CancellationToken.None,
            It.Is<FindingInspectReadOptions>(o => o.ExpectedRunId == A)))
            .ReturnsAsync(new ArchLucid.Contracts.Findings.FindingInspectResponse { RunId = B });
        Mock<IAskEvidenceAccess> access = Access();
        access.Setup(a => a.CanReadRunAsync(Scope, A, CancellationToken.None)).ReturnsAsync(true);
        AskService service = CreateStrictService(access.Object, findings: findings.Object);

        Func<Task> act = () => service.AskAboutFindingAsync(new FindingAskRequest
        {
            FindingId = finding, Question = "Explain",
        }, Scope, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*not available*");
    }

    [Fact]
    public void History_replays_only_completed_same_actor_turns_with_current_evidence_authority()
    {
        Guid threadId = Guid.NewGuid();
        ConversationMessage user = new() { ThreadId = threadId, Role = ConversationMessageRole.User, Content = "question" };
        ConversationMessage Assistant(string answer, AskHistoryEvidenceScope? proof) => new()
        {
            ThreadId = threadId, Role = ConversationMessageRole.Assistant, Content = answer,
            MetadataJson = JsonSerializer.Serialize(new { askEvidenceScopeV1 = proof },
                new JsonSerializerOptions(JsonSerializerDefaults.Web)),
        };
        ConversationMessage good = Assistant("allowed", AskHistoryEvidenceScope.Create(threadId, Actor,
            new HashSet<Guid> { A }, user.Content, false));
        ConversationMessage revoked = Assistant("revoked", AskHistoryEvidenceScope.Create(threadId, Actor,
            new HashSet<Guid> { A, B }, user.Content, false));
        ConversationMessage otherActor = Assistant("other", AskHistoryEvidenceScope.Create(threadId, "jwt:tenant:other",
            new HashSet<Guid> { A }, user.Content, false));
        ConversationMessage legacy = Assistant("legacy", null);
        ConversationMessage platform = Assistant("platform", AskHistoryEvidenceScope.Create(threadId, Actor,
            new HashSet<Guid> { A }, user.Content, true));
        ConversationMessage wrongThread = Assistant("wrong-thread", AskHistoryEvidenceScope.Create(Guid.NewGuid(), Actor,
            new HashSet<Guid> { A }, user.Content, false));

        IReadOnlyList<ConversationMessage> selected = AskHistoryEvidenceScope.SelectVerifiedTurns(
            [user, legacy, revoked, otherActor, platform, wrongThread, good], threadId, Actor, new HashSet<Guid> { A });

        selected.Should().Equal(user, good);
    }

    private static ConversationThread Thread(Guid? runId) => new()
    {
        ThreadId = Guid.NewGuid(), TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId,
        ProjectId = Scope.ProjectId, RunId = runId,
    };

    private static Mock<IAskEvidenceAccess> Access()
    {
        Mock<IAskEvidenceAccess> access = new(MockBehavior.Strict);
        access.Setup(a => a.GetAuthorizedActorId()).Returns(Actor);
        return access;
    }

    private static AskService CreateStrictService(IAskEvidenceAccess access,
        IConversationService? conversation = null, IFindingInspectReadRepository? findings = null) =>
        AskServiceTestFactory.Create(
            llm: new Mock<IAgentCompletionClient>(MockBehavior.Strict).Object,
            conversationService: conversation ?? new Mock<IConversationService>(MockBehavior.Strict).Object,
            findingInspectReadRepository: findings ?? new Mock<IFindingInspectReadRepository>(MockBehavior.Strict).Object,
            query: new Mock<IAuthorityQueryService>(MockBehavior.Strict).Object,
            provenanceQuery: new Mock<IProvenanceQueryService>(MockBehavior.Strict).Object,
            retrievalQuery: new Mock<IRetrievalQueryService>(MockBehavior.Strict).Object,
            runRepository: new Mock<IRunRepository>(MockBehavior.Strict).Object,
            evidenceAccess: access);
}
