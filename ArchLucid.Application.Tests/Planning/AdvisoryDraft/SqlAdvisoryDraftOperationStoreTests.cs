using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Planning;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Planning.AdvisoryDraft;

[Trait("Category", "Unit")]
public sealed class SqlAdvisoryDraftOperationStoreTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject,
    };

    [Fact]
    public async Task Canceled_queue_handoff_closes_the_persisted_operation()
    {
        using CancellationTokenSource request = new();
        SqlAdvisoryDraftOperationStore persisted = new(new InMemoryAdvisoryDraftOperationRepository());
        Mock<IAdvisoryDraftOperationStore> store = new(MockBehavior.Strict);
        string? operationId = null;
        store.Setup(s => s.CreatePendingAsync(DefaultScope, request.Token)).Returns(async () =>
        {
            AdvisoryDraftOperationCreateResult result = await persisted.CreatePendingAsync(DefaultScope, request.Token);
            operationId = OperationIdCodec.ForDraft(result.Record.OperationId);
            request.Cancel();
            return result;
        });
        store.Setup(s => s.MarkCanceledAsync(DefaultScope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((ScopeContext scope, string id, CancellationToken ct) => persisted.MarkCanceledAsync(scope, id, ct));
        AdvisoryDraftOperationQueue queue = new();
        AdvisoryDraftOperationAcceptor acceptor = new(store.Object, queue);

        Func<Task> accept = () => acceptor.AcceptAsync(
            new DraftArchitectureRequestInput(), DefaultScope, request.Token);
        await accept.Should().ThrowAsync<OperationCanceledException>();

        AdvisoryDraftOperationRecord? record = await persisted.GetAsync(operationId!, DefaultScope);
        record!.State.Should().Be(OperationState.Canceled);
        record.CompletedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task CreatePending_persists_and_survives_new_store_instance()
    {
        InMemoryAdvisoryDraftOperationRepository repository = new();
        SqlAdvisoryDraftOperationStore firstStore = new(repository);

        AdvisoryDraftOperationCreateResult created = await firstStore.CreatePendingAsync(DefaultScope);
        created.Created.Should().BeTrue();

        SqlAdvisoryDraftOperationStore secondStore = new(repository);
        string operationId = OperationIdCodec.ForDraft(created.Record.OperationId);

        AdvisoryDraftOperationRecord? record = await secondStore.GetAsync(operationId, DefaultScope);

        record.Should().NotBeNull();
        record!.State.Should().Be(OperationState.Pending);
        record.StepLabel.Should().Be(AdvisoryDraftOperationSteps.Queued);
    }

    [Fact]
    public async Task TryInsertPending_same_operation_id_is_idempotent()
    {
        InMemoryAdvisoryDraftOperationRepository repository = new();
        Guid operationId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        DateTimeOffset now = DateTimeOffset.Parse("2026-01-01T00:00:00Z");

        AdvisoryDraftOperationRow row = new()
        {
            TenantId = DefaultScope.TenantId,
            WorkspaceId = DefaultScope.WorkspaceId,
            ProjectId = DefaultScope.ProjectId,
            OperationId = operationId,
            State = OperationState.Pending,
            StepLabel = AdvisoryDraftOperationSteps.Queued,
            CurrentStep = 0,
            CreatedUtc = now,
            HeartbeatUtc = now,
        };

        (await repository.TryInsertPendingAsync(row, CancellationToken.None)).Should().BeTrue();
        (await repository.TryInsertPendingAsync(row, CancellationToken.None)).Should().BeFalse();
    }

    [Fact]
    public async Task MarkSucceeded_round_trips_result_json()
    {
        InMemoryAdvisoryDraftOperationRepository repository = new();
        SqlAdvisoryDraftOperationStore store = new(repository);
        AdvisoryDraftOperationCreateResult created = await store.CreatePendingAsync(DefaultScope);
        string operationId = OperationIdCodec.ForDraft(created.Record.OperationId);
        DraftArchitectureRequestResponse result = new()
        {
            SuggestedConstraints = ["Private networking"],
            SuggestedAssumptions = ["Single region"],
            SuggestedCapabilities = ["Audit logging"],
        };

        await store.MarkSucceededAsync(DefaultScope, operationId, result);

        AdvisoryDraftOperationRecord? record = await store.GetAsync(operationId, DefaultScope);
        record.Should().NotBeNull();
        record!.Result.Should().NotBeNull();
        record.Result!.SuggestedConstraints.Should().ContainSingle("Private networking");
        record.State.Should().Be(OperationState.Succeeded);
    }
}
