using System.Text.Json;

using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConversationControllerShareAccessTests
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
    [InlineData(null)]
    [InlineData("api-user")]
    public async Task Unidentified_actor_cannot_list_or_read_conversations(string? actor)
    {
        Harness h = new(actor);
        AssertStatus(await h.Controller.ListThreads(ct: CancellationToken.None), 404);
        AssertStatus(await h.Controller.GetMessages(Guid.NewGuid(), ct: CancellationToken.None), 404);
        h.Threads.VerifyNoOtherCalls();
        h.Messages.VerifyNoOtherCalls();
        h.Runs.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("scope")]
    [InlineData("primary")]
    [InlineData("comparison")]
    [InlineData("archived")]
    [InlineData("partial-comparison")]
    public async Task Denied_or_invalid_thread_stops_before_message_or_project_reads(string kind)
    {
        Harness h = new();
        ConversationThread thread = Thread(A);
        switch (kind)
        {
            case "scope":
                thread.ProjectId = Guid.NewGuid();
                break;
            case "primary":
                h.CanRead(A, false);
                break;
            case "comparison":
                thread.BaseRunId = A;
                thread.TargetRunId = B;
                h.CanRead(A, true);
                h.CanRead(B, false);
                break;
            case "archived":
                thread.ArchivedUtc = DateTime.UtcNow;
                break;
            case "partial-comparison":
                thread.BaseRunId = A;
                break;
        }
        h.Threads.Setup(t => t.GetByIdAsync(thread.ThreadId, CancellationToken.None)).ReturnsAsync(thread);

        AssertStatus(await h.Controller.GetMessages(thread.ThreadId, ct: CancellationToken.None), 404);

        h.Messages.VerifyNoOtherCalls();
        h.Runs.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetMessages_filters_legacy_revoked_other_actor_and_platform_turns_before_take()
    {
        Harness h = new();
        ConversationThread thread = Thread(A);
        h.Threads.Setup(t => t.GetByIdAsync(thread.ThreadId, CancellationToken.None)).ReturnsAsync(thread);
        h.CanRead(A, true);
        h.CanRead(B, false);
        h.Project(A, B);

        ConversationMessage[] permitted = Turn(thread, "allowed", Actor, [A], 1);
        ConversationMessage[] revoked = Turn(thread, "revoked", Actor, [A, B], 2);
        ConversationMessage[] foreign = Turn(thread, "foreign", "jwt:tenant:other", [A], 3);
        ConversationMessage[] legacy = Turn(thread, "legacy", Actor, [A], 4, legacy: true);
        ConversationMessage[] platform = Turn(thread, "platform", Actor, [A], 5, platform: true);
        h.Messages.Setup(m => m.GetByThreadIdAsync(thread.ThreadId, PaginationDefaults.MaxListingTake,
                CancellationToken.None))
            .ReturnsAsync(permitted.Concat(revoked).Concat(foreign).Concat(legacy).Concat(platform).ToArray());

        IActionResult result = await h.Controller.GetMessages(thread.ThreadId, 2, CancellationToken.None);
        IReadOnlyList<ConversationMessage> rows = result.Should().BeOfType<OkObjectResult>().Which.Value
            .Should().BeAssignableTo<IReadOnlyList<ConversationMessage>>().Subject;

        rows.Select(m => m.Content).Should().Equal("question-allowed", "allowed");
        rows[0].MessageId.Should().NotBe(permitted[0].MessageId);
        rows[0].CreatedUtc.Should().Be(permitted[1].CreatedUtc);
        rows[0].MetadataJson.Should().Be("{}");
        rows[1].MessageId.Should().Be(permitted[1].MessageId);
        rows[1].MetadataJson.Should().Contain("referencedFindings").And.NotContain("askEvidenceScopeV1");
        h.Access.Verify(a => a.CanReadRunAsync(Scope, A, CancellationToken.None), Times.Once);
        h.Access.Verify(a => a.CanReadRunAsync(Scope, B, CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Legacy_unanchored_thread_with_no_verified_turn_is_not_found()
    {
        Harness h = new();
        ConversationThread thread = Thread(null);
        h.Threads.Setup(t => t.GetByIdAsync(thread.ThreadId, CancellationToken.None)).ReturnsAsync(thread);
        h.Project();
        h.Messages.Setup(m => m.GetByThreadIdAsync(thread.ThreadId, PaginationDefaults.MaxListingTake,
                CancellationToken.None))
            .ReturnsAsync(Turn(thread, "legacy", Actor, [], 1, legacy: true));

        AssertStatus(await h.Controller.GetMessages(thread.ThreadId, ct: CancellationToken.None), 404);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Incomplete_project_enumeration_never_broadens_direct_message_authority(bool anchored)
    {
        Harness h = new();
        ConversationThread thread = Thread(anchored ? A : null);
        h.Threads.Setup(t => t.GetByIdAsync(thread.ThreadId, CancellationToken.None)).ReturnsAsync(thread);
        if (anchored)
            h.CanRead(A, true);
        h.Runs.Setup(r => r.ListRecentInScopeKeysetAsync(Scope, null, null, RunPagination.MaxTake,
            CancellationToken.None)).ReturnsAsync(new RunListPage([], true));

        if (anchored)
        {
            h.Messages.Setup(m => m.GetByThreadIdAsync(thread.ThreadId, PaginationDefaults.MaxListingTake,
                CancellationToken.None)).ReturnsAsync(Turn(thread, "allowed", Actor, [A], 1)
                    .Concat(Turn(thread, "unknown", Actor, [A, B], 2)).ToArray());
        }

        IActionResult result = await h.Controller.GetMessages(thread.ThreadId, ct: CancellationToken.None);
        if (!anchored)
        {
            AssertStatus(result, 404);
            h.Messages.VerifyNoOtherCalls();
        }
        else
        {
            IReadOnlyList<ConversationMessage> rows = result.Should().BeOfType<OkObjectResult>().Which.Value
                .Should().BeAssignableTo<IReadOnlyList<ConversationMessage>>().Subject;
            rows.Select(m => m.Content).Should().Equal("question-allowed", "allowed");
        }
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Listing_counts_and_pages_only_verified_threads(bool paged)
    {
        Harness h = new();
        ConversationThread newest = Thread(A);
        ConversationThread older = Thread(null);
        ConversationThread restricted = Thread(B);
        ConversationThread legacy = Thread(null);
        ConversationThread foreign = Thread(A);
        // Raw ordering and timestamps are unrelated to the caller's verified activity.
        older.LastUpdatedUtc = DateTime.UtcNow.AddDays(10);
        newest.Title = "unverified title";
        h.Candidates(restricted, older, legacy, foreign, newest);
        h.CanRead(A, true);
        h.CanRead(B, false);
        h.Project(A, B);
        h.ListingMessages(older, Turn(older, "older", Actor, [], 1));
        h.ListingMessages(legacy, Turn(legacy, "legacy", Actor, [], 5, legacy: true));
        h.ListingMessages(foreign, Turn(foreign, "foreign", "jwt:tenant:other", [A], 6));
        h.ListingMessages(newest, Turn(newest, "newest", Actor, [A], 2));

        IActionResult result = await h.Controller.ListThreads(take: 1, page: paged ? 2 : null,
            pageSize: 1, ct: CancellationToken.None);
        PagedResponse<ConversationThread> response = result.Should().BeOfType<OkObjectResult>().Which.Value
            .Should().BeOfType<PagedResponse<ConversationThread>>().Subject;

        response.TotalCount.Should().Be(paged ? 2 : 1);
        ConversationThread visible = response.Items.Should().ContainSingle().Which;
        visible.ThreadId.Should().Be(paged ? older.ThreadId : newest.ThreadId);
        visible.Title.Should().Be("Architecture Conversation");
        visible.LastUpdatedUtc.Should().Be(Stamp(paged ? 1 : 2));
        visible.CreatedUtc.Should().Be(visible.LastUpdatedUtc);
        h.Messages.Verify(m => m.GetByThreadIdAsync(restricted.ThreadId, It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
        h.Access.Verify(a => a.CanReadRunAsync(Scope, A, CancellationToken.None), Times.Once);
        h.Access.Verify(a => a.CanReadRunAsync(Scope, B, CancellationToken.None), Times.Once);
    }

    [Theory]
    [InlineData(501)]
    [InlineData(1)]
    public async Task Incomplete_candidate_listing_fails_without_disclosing_raw_count(int total)
    {
        Harness h = new();
        h.Threads.Setup(t => t.ListByScopePagedAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
            0, PaginationDefaults.MaxPageSize, CancellationToken.None))
            .ReturnsAsync(((IReadOnlyList<ConversationThread>)Array.Empty<ConversationThread>(), total));

        AssertStatus(await h.Controller.ListThreads(page: 1, ct: CancellationToken.None), 409);
        h.Messages.VerifyNoOtherCalls();
        h.Runs.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Listing_with_incomplete_run_authorization_fails_before_messages()
    {
        Harness h = new();
        h.Candidates(Thread(null));
        h.Runs.Setup(r => r.ListRecentInScopeKeysetAsync(Scope, null, null, RunPagination.MaxTake,
            CancellationToken.None)).ReturnsAsync(new RunListPage([], true));

        AssertStatus(await h.Controller.ListThreads(ct: CancellationToken.None), 409);
        h.Messages.VerifyNoOtherCalls();
    }

    private static ConversationThread Thread(Guid? runId) => new()
    {
        ThreadId = Guid.NewGuid(), TenantId = Scope.TenantId, WorkspaceId = Scope.WorkspaceId,
        ProjectId = Scope.ProjectId, RunId = runId,
    };

    private static DateTime Stamp(int minute) => new DateTime(2026, 11, 24, 0, minute, 0, DateTimeKind.Utc);

    private static ConversationMessage[] Turn(ConversationThread thread, string answer, string actor,
        HashSet<Guid> runIds, int minute, bool legacy = false, bool platform = false)
    {
        string question = "question-" + answer;
        AskHistoryEvidenceScope? proof = legacy ? null :
            AskHistoryEvidenceScope.Create(thread.ThreadId, actor, runIds, question, platform);
        return
        [
            new ConversationMessage
            {
                ThreadId = thread.ThreadId, Role = ConversationMessageRole.User,
                Content = question, CreatedUtc = Stamp(minute).AddSeconds(-1),
            },
            new ConversationMessage
            {
                ThreadId = thread.ThreadId, Role = ConversationMessageRole.Assistant,
                Content = answer, CreatedUtc = Stamp(minute),
                MetadataJson = JsonSerializer.Serialize(new
                {
                    askEvidenceScopeV1 = proof,
                    referencedFindings = new[] { "visible-finding" },
                }, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            },
        ];
    }

    private static void AssertStatus(IActionResult result, int expected) =>
        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(expected);

    private sealed class Harness
    {
        public readonly Mock<IConversationThreadRepository> Threads = new(MockBehavior.Strict);
        public readonly Mock<IConversationMessageRepository> Messages = new(MockBehavior.Strict);
        public readonly Mock<IRunRepository> Runs = new(MockBehavior.Strict);
        public readonly Mock<IAskEvidenceAccess> Access = new(MockBehavior.Strict);
        public ConversationController Controller { get; }

        public Harness(string? actor = Actor)
        {
            Access.Setup(a => a.GetAuthorizedActorId()).Returns(actor);
            Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
            scopes.Setup(s => s.GetCurrentScope()).Returns(Scope);
            Controller = new ConversationController(Threads.Object, Messages.Object, scopes.Object,
                Access.Object, Runs.Object)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
            };
        }

        public void CanRead(Guid run, bool allowed) =>
            Access.Setup(a => a.CanReadRunAsync(Scope, run, CancellationToken.None)).ReturnsAsync(allowed);

        public void Project(params Guid[] ids) =>
            Runs.Setup(r => r.ListRecentInScopeKeysetAsync(Scope, null, null, RunPagination.MaxTake,
                CancellationToken.None)).ReturnsAsync(new RunListPage(
                ids.Select(id => new RunRecord { RunId = id }).ToArray(), false));

        public void Candidates(params ConversationThread[] threads) =>
            Threads.Setup(t => t.ListByScopePagedAsync(Scope.TenantId, Scope.WorkspaceId, Scope.ProjectId,
                0, PaginationDefaults.MaxPageSize, CancellationToken.None))
                .ReturnsAsync(((IReadOnlyList<ConversationThread>)threads, threads.Length));

        public void ListingMessages(ConversationThread thread, ConversationMessage[] messages) =>
            Messages.Setup(m => m.GetByThreadIdAsync(thread.ThreadId, 40, CancellationToken.None))
                .ReturnsAsync(messages);
    }
}
