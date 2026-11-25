using System.Text.Json;

using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Ask;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Conversation;

using FluentAssertions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     <see cref="ConversationService" /> thread lifecycle: get-or-create, append messages, history, last-updated bumps.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ConversationServiceTests
{
    private readonly Guid _project = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private readonly Guid _tenant = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private readonly Guid _workspace = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [SkippableFact]
    public async Task GetOrCreateThreadAsync_creates_new_thread_when_id_null()
    {
        Mock<IConversationThreadRepository> threads = new();
        Mock<IConversationMessageRepository> messages = new();

        threads
            .Setup(x => x.CreateAsync(It.IsAny<ConversationThread>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ConversationService sut = new(threads.Object, messages.Object);

        ConversationThread thread = await sut.GetOrCreateThreadAsync(
            null,
            _tenant,
            _workspace,
            _project,
            null,
            null,
            null,
            CancellationToken.None);

        thread.ThreadId.Should().NotBeEmpty();
        thread.TenantId.Should().Be(_tenant);
        thread.WorkspaceId.Should().Be(_workspace);
        thread.ProjectId.Should().Be(_project);

        threads.Verify(
            x => x.CreateAsync(It.Is<ConversationThread>(t => t.ThreadId == thread.ThreadId),
                It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task GetOrCreateThreadAsync_returns_existing_when_id_matches_scope()
    {
        Guid existingId = Guid.NewGuid();
        ConversationThread existing = new()
        {
            ThreadId = existingId,
            TenantId = _tenant,
            WorkspaceId = _workspace,
            ProjectId = _project,
            Title = "T",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            LastUpdatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        Mock<IConversationThreadRepository> threads = new();
        Mock<IConversationMessageRepository> messages = new();

        threads
            .Setup(x => x.GetByIdAsync(existingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        ConversationService sut = new(threads.Object, messages.Object);

        ConversationThread result = await sut.GetOrCreateThreadAsync(
            existingId,
            _tenant,
            _workspace,
            _project,
            null,
            null,
            null,
            CancellationToken.None);

        result.Should().BeSameAs(existing);
        threads.Verify(x => x.CreateAsync(It.IsAny<ConversationThread>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [SkippableFact]
    public async Task GetOrCreateThreadAsync_throws_when_thread_scope_mismatches()
    {
        Guid existingId = Guid.NewGuid();
        ConversationThread wrongScope = new()
        {
            ThreadId = existingId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = _workspace,
            ProjectId = _project,
            Title = "T",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            LastUpdatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        Mock<IConversationThreadRepository> threads = new();
        threads.Setup(x => x.GetByIdAsync(existingId, It.IsAny<CancellationToken>())).ReturnsAsync(wrongScope);

        ConversationService sut = new(threads.Object, Mock.Of<IConversationMessageRepository>());

        Func<Task> act = async () => await sut.GetOrCreateThreadAsync(
            existingId,
            _tenant,
            _workspace,
            _project,
            null,
            null,
            null,
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*not found for the current scope*");
    }

    [SkippableFact]
    public async Task AppendUserMessageAsync_adds_message_and_updates_thread_timestamp()
    {
        Guid threadId = Guid.NewGuid();

        Mock<IConversationThreadRepository> threads = new();
        Mock<IConversationMessageRepository> messages = new();

        messages
            .Setup(x => x.AddAsync(It.IsAny<ConversationMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        threads
            .Setup(x => x.UpdateLastUpdatedAsync(threadId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ConversationService sut = new(threads.Object, messages.Object);

        await sut.AppendUserMessageAsync(threadId, "Hello", CancellationToken.None);

        messages.Verify(
            x => x.AddAsync(
                It.Is<ConversationMessage>(m =>
                    m.ThreadId == threadId &&
                    m.Role == ConversationMessageRole.User &&
                    m.Content == "Hello" &&
                    m.MetadataJson.Contains("conversationQuestionKeyV1") &&
                    !m.MetadataJson.Contains("Hello")),
                It.IsAny<CancellationToken>()),
            Times.Once);

        threads.Verify(
            x => x.UpdateLastUpdatedAsync(threadId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [SkippableFact]
    public async Task AppendAssistantMessageAsync_adds_message_with_metadata_and_updates_thread()
    {
        Guid threadId = Guid.NewGuid();

        Mock<IConversationThreadRepository> threads = new();
        Mock<IConversationMessageRepository> messages = new();

        messages
            .Setup(x => x.AddAsync(It.IsAny<ConversationMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        threads
            .Setup(x => x.UpdateLastUpdatedAsync(threadId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ConversationService sut = new(threads.Object, messages.Object);

        await sut.AppendAssistantMessageAsync(threadId, "Reply body", """{"citations":[]}""", CancellationToken.None);

        messages.Verify(
            x => x.AddAsync(
                It.Is<ConversationMessage>(m =>
                    m.ThreadId == threadId &&
                    m.Role == ConversationMessageRole.Assistant &&
                    m.Content == "Reply body" &&
                    m.MetadataJson.Contains("citations", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);

        threads.Verify(
            x => x.UpdateLastUpdatedAsync(threadId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Model_history_loads_only_authorized_ask_or_draft_turns(bool forDraft)
    {
        ScopeContext scope = new() { TenantId = _tenant, WorkspaceId = _workspace, ProjectId = _project };
        Guid threadId = Guid.NewGuid(), draftId = Guid.NewGuid(), archId = Guid.NewGuid(), runId = Guid.NewGuid();
        const string actor = "current-actor";
        HashSet<Guid> authorizedRuns = [runId];
        ConversationMessage[] expected = Turn("allowed", actor, authorizedRuns, forDraft ? draftId : null, archId);
        ConversationMessage[] stale = Turn("old question", actor, authorizedRuns, forDraft ? draftId : null, archId);
        stale[0].MetadataJson = "{}";
        var headers = expected
            .Concat(Turn("denied run", actor, new HashSet<Guid> { Guid.NewGuid() }, forDraft ? draftId : null, archId))
            .Concat(Turn("other actor", "foreign", authorizedRuns, forDraft ? draftId : null, archId))
            .Concat(Turn("different proof kind", actor, authorizedRuns, forDraft ? null : draftId, archId))
            .Concat(Turn("different draft", actor, authorizedRuns, Guid.NewGuid(), archId))
            .Concat(stale)
            .Select(ConversationProofRow.FromStoredMetadata).ToArray();
        var allowedIds = expected.Select(m => m.MessageId).ToHashSet();
        Mock<IConversationMessageRepository> messages = new(MockBehavior.Strict);
        messages.Setup(r => r.GetRecentProofsAsync(scope, threadId, 25, CancellationToken.None)).ReturnsAsync(headers);
        messages.Setup(r => r.GetAuthorizedMessagesAsync(scope, threadId,
                It.Is<IReadOnlyCollection<Guid>>(ids => allowedIds.SetEquals(ids)), CancellationToken.None))
            .ReturnsAsync(expected);
        ConversationService sut = new(Mock.Of<IConversationThreadRepository>(), messages.Object);

        IReadOnlyList<ConversationMessage> actual = forDraft
            ? await sut.GetVerifiedDraftHistoryAsync(scope, threadId, 25, draftId, archId, actor, authorizedRuns, CancellationToken.None)
            : await sut.GetVerifiedAskHistoryAsync(scope, threadId, 25, actor, authorizedRuns, CancellationToken.None);
        actual.Should().Equal(expected);
        messages.Verify(r => r.GetRecentProofsAsync(scope, threadId, 25, CancellationToken.None), Times.Once);
        messages.Verify(r => r.GetAuthorizedMessagesAsync(scope, threadId,
            It.Is<IReadOnlyCollection<Guid>>(ids => allowedIds.SetEquals(ids)), CancellationToken.None), Times.Once);
        messages.VerifyNoOtherCalls();

        ConversationMessage[] Turn(string question, string owner, IReadOnlySet<Guid> runs, Guid? draft, Guid? architecture)
        {
            var proof = draft is Guid id
                ? AskHistoryEvidenceScope.CreateForDraft(threadId, id, architecture, owner, runs, question)
                : AskHistoryEvidenceScope.Create(threadId, owner, runs, question, false);
            string property = draft.HasValue ? "draftIntakeEvidenceScopeV1" : "askEvidenceScopeV1";
            return
            [
                new ConversationMessage
                {
                    ThreadId = threadId, Role = ConversationMessageRole.User, Content = question,
                    MetadataJson = AskHistoryEvidenceScope.CreateQuestionMetadata(threadId, question),
                },
                new ConversationMessage
                {
                    ThreadId = threadId, Role = ConversationMessageRole.Assistant, Content = "answer " + question,
                    MetadataJson = JsonSerializer.Serialize(new Dictionary<string, AskHistoryEvidenceScope?> { [property] = proof },
                        new JsonSerializerOptions(JsonSerializerDefaults.Web)),
                },
            ];
        }
    }

    [SkippableFact]
    public async Task GetOrCreateThreadAsync_creates_new_thread_when_supplied_id_is_missing()
    {
        Guid requestedId = Guid.NewGuid();

        Mock<IConversationThreadRepository> threads = new();
        Mock<IConversationMessageRepository> messages = new();

        threads
            .Setup(x => x.GetByIdAsync(requestedId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConversationThread?)null);
        threads
            .Setup(x => x.CreateAsync(It.IsAny<ConversationThread>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ConversationService sut = new(threads.Object, messages.Object);

        ConversationThread thread = await sut.GetOrCreateThreadAsync(
            requestedId,
            _tenant,
            _workspace,
            _project,
            null,
            null,
            null,
            CancellationToken.None);

        thread.ThreadId.Should().NotBe(requestedId);
        threads.Verify(x => x.CreateAsync(It.IsAny<ConversationThread>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task Unproven_history_has_no_payload_read()
    {
        ScopeContext scope = new() { TenantId = _tenant, WorkspaceId = _workspace, ProjectId = _project };
        Guid threadId = Guid.NewGuid();
        const int take = 40;

        Mock<IConversationMessageRepository> messages = new(MockBehavior.Strict);
        messages
            .Setup(x => x.GetRecentProofsAsync(scope, threadId, take, CancellationToken.None))
            .ReturnsAsync([new ConversationProofRow
            { ThreadId = threadId, MessageId = Guid.NewGuid(), Role = ConversationMessageRole.Assistant }]);

        ConversationService sut = new(Mock.Of<IConversationThreadRepository>(), messages.Object);

        var result = await sut.GetVerifiedAskHistoryAsync(scope, threadId, take, "current-actor",
            new HashSet<Guid>(), CancellationToken.None);

        result.Should().BeEmpty();
        messages.Verify(x => x.GetRecentProofsAsync(scope, threadId, take, CancellationToken.None), Times.Once);
        messages.VerifyNoOtherCalls();
    }

    [SkippableFact]
    public async Task AppendUserMessageAsync_persists_empty_content_without_service_validation()
    {
        Guid threadId = Guid.NewGuid();

        Mock<IConversationThreadRepository> threads = new();
        Mock<IConversationMessageRepository> messages = new();

        messages
            .Setup(x => x.AddAsync(It.IsAny<ConversationMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        threads
            .Setup(x => x.UpdateLastUpdatedAsync(threadId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ConversationService sut = new(threads.Object, messages.Object);

        await sut.AppendUserMessageAsync(threadId, string.Empty, CancellationToken.None);

        messages.Verify(
            x => x.AddAsync(
                It.Is<ConversationMessage>(m => m.Content == string.Empty),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
