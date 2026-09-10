using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Planning;
using ArchLucid.TestSupport;

using FluentAssertions;

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
    public void CreatePending_persists_and_survives_new_store_instance()
    {
        InMemoryAdvisoryDraftOperationRepository repository = new();
        SqlAdvisoryDraftOperationStore firstStore = new(repository);

        AdvisoryDraftOperationCreateResult created = firstStore.CreatePending(DefaultScope);
        created.Created.Should().BeTrue();

        SqlAdvisoryDraftOperationStore secondStore = new(repository);
        string operationId = OperationIdCodec.ForDraft(created.Record.OperationId);

        bool found = secondStore.TryGet(operationId, DefaultScope, out AdvisoryDraftOperationRecord? record);

        found.Should().BeTrue();
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
    public void MarkSucceeded_round_trips_result_json()
    {
        InMemoryAdvisoryDraftOperationRepository repository = new();
        SqlAdvisoryDraftOperationStore store = new(repository);
        AdvisoryDraftOperationCreateResult created = store.CreatePending(DefaultScope);
        string operationId = OperationIdCodec.ForDraft(created.Record.OperationId);
        DraftArchitectureRequestResponse result = new()
        {
            SuggestedConstraints = ["Private networking"],
            SuggestedAssumptions = ["Single region"],
            SuggestedCapabilities = ["Audit logging"],
        };

        store.MarkSucceeded(operationId, result);

        store.TryGet(operationId, DefaultScope, out AdvisoryDraftOperationRecord? record).Should().BeTrue();
        record!.Result.Should().NotBeNull();
        record.Result!.SuggestedConstraints.Should().ContainSingle("Private networking");
        record.State.Should().Be(OperationState.Succeeded);
    }
}
