using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public abstract class VerifiedRemediationControlAssociationRepositoryContractTests
{
    protected virtual void SkipIfUnavailable()
    {
    }

    protected abstract IVerifiedRemediationControlAssociationRepository CreateRepository();

    protected virtual Task PrepareStorageAsync(
        ProjectScopeKey scope,
        Guid instanceId,
        Guid verificationSnapshotId) =>
        Task.CompletedTask;

    [SkippableFact]
    public async Task Upsert_returns_the_row_in_the_same_scope()
    {
        SkipIfUnavailable();
        ProjectScopeKey scope = CreateScope();
        Guid instanceId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        await PrepareStorageAsync(scope, instanceId, snapshotId);
        IVerifiedRemediationControlAssociationRepository repository = CreateRepository();
        VerifiedRemediationControlAssociationRecord record = CreateRecord(scope, instanceId, snapshotId, Guid.NewGuid());

        VerifiedRemediationControlAssociationRecord stored = await repository.UpsertAsync(scope, record);
        VerifiedRemediationControlAssociationRecord? loaded = await repository.TryGetAsync(scope, stored.AssociationId);

        loaded.Should().NotBeNull();
        loaded!.AssociationId.Should().Be(record.AssociationId);
        loaded.ControlId.Should().Be(record.ControlId);
        loaded.VerificationSnapshotId.Should().Be(snapshotId);
    }

    [SkippableFact]
    public async Task Second_upsert_of_the_same_key_updates_the_timestamp_and_does_not_add_a_row()
    {
        SkipIfUnavailable();
        ProjectScopeKey scope = CreateScope();
        Guid instanceId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        await PrepareStorageAsync(scope, instanceId, snapshotId);
        IVerifiedRemediationControlAssociationRepository repository = CreateRepository();
        VerifiedRemediationControlAssociationRecord first = CreateRecord(
            scope,
            instanceId,
            snapshotId,
            controlId,
            updatedUtc: new DateTime(2026, 10, 12, 12, 0, 0, DateTimeKind.Utc));
        VerifiedRemediationControlAssociationRecord second = CreateRecord(
            scope,
            instanceId,
            snapshotId,
            controlId,
            updatedUtc: new DateTime(2026, 10, 12, 13, 0, 0, DateTimeKind.Utc));

        VerifiedRemediationControlAssociationRecord stored = await repository.UpsertAsync(scope, first);
        VerifiedRemediationControlAssociationRecord touched = await repository.UpsertAsync(scope, second);
        IReadOnlyList<VerifiedRemediationControlAssociationRecord> rows =
            await repository.ListByInstanceAsync(scope, instanceId);

        rows.Should().ContainSingle();
        touched.AssociationId.Should().Be(stored.AssociationId);
        touched.UpdatedUtc.Should().Be(second.UpdatedUtc);
        touched.CreatedUtc.Should().Be(first.CreatedUtc);
    }

    [SkippableFact]
    public async Task A_different_snapshot_adds_a_second_row()
    {
        SkipIfUnavailable();
        ProjectScopeKey scope = CreateScope();
        Guid instanceId = Guid.NewGuid();
        Guid firstSnapshotId = Guid.NewGuid();
        Guid secondSnapshotId = Guid.NewGuid();
        Guid controlId = Guid.NewGuid();
        await PrepareStorageAsync(scope, instanceId, firstSnapshotId);
        await PrepareStorageAsync(scope, instanceId, secondSnapshotId);
        IVerifiedRemediationControlAssociationRepository repository = CreateRepository();

        await repository.UpsertAsync(scope, CreateRecord(scope, instanceId, firstSnapshotId, controlId));
        await repository.UpsertAsync(scope, CreateRecord(scope, instanceId, secondSnapshotId, controlId));
        IReadOnlyList<VerifiedRemediationControlAssociationRecord> rows =
            await repository.ListByInstanceAsync(scope, instanceId);

        rows.Select(row => row.VerificationSnapshotId).Should().BeEquivalentTo([firstSnapshotId, secondSnapshotId]);
    }

    [SkippableFact]
    public async Task A_row_in_another_scope_is_not_returned()
    {
        SkipIfUnavailable();
        ProjectScopeKey scope = CreateScope();
        ProjectScopeKey otherTenant = CreateScope();
        ProjectScopeKey otherProject = ProjectScopeKey.Create(scope.TenantId, scope.WorkspaceId, Guid.NewGuid());
        Guid instanceId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        await PrepareStorageAsync(scope, instanceId, snapshotId);
        IVerifiedRemediationControlAssociationRepository repository = CreateRepository();
        VerifiedRemediationControlAssociationRecord stored =
            await repository.UpsertAsync(scope, CreateRecord(scope, instanceId, snapshotId, Guid.NewGuid()));

        VerifiedRemediationControlAssociationRecord? otherTenantRow =
            await repository.TryGetAsync(otherTenant, stored.AssociationId);
        IReadOnlyList<VerifiedRemediationControlAssociationRecord> otherProjectRows =
            await repository.ListByInstanceAsync(otherProject, instanceId);

        otherTenantRow.Should().BeNull();
        otherProjectRows.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task A_payload_outside_the_scope_is_rejected()
    {
        SkipIfUnavailable();
        ProjectScopeKey scope = CreateScope();
        ProjectScopeKey otherScope = CreateScope();
        IVerifiedRemediationControlAssociationRepository repository = CreateRepository();
        VerifiedRemediationControlAssociationRecord record = CreateRecord(
            otherScope,
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid());

        Func<Task> act = () => repository.UpsertAsync(scope, record);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [SkippableFact]
    public async Task An_empty_control_id_is_rejected()
    {
        SkipIfUnavailable();
        ProjectScopeKey scope = CreateScope();
        IVerifiedRemediationControlAssociationRepository repository = CreateRepository();
        VerifiedRemediationControlAssociationRecord record = CreateRecord(scope, Guid.NewGuid(), Guid.NewGuid(), Guid.Empty);

        Func<Task> act = () => repository.UpsertAsync(scope, record);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [SkippableFact]
    public async Task List_by_control_and_linked_snapshots_returns_only_matching_rows()
    {
        SkipIfUnavailable();
        ProjectScopeKey scope = CreateScope();
        IVerifiedRemediationControlAssociationRepository repository = CreateRepository();
        Guid controlId = Guid.NewGuid();
        Guid inventorySnapshotId = Guid.NewGuid();
        Guid otherControlId = Guid.NewGuid();
        Guid instanceOne = Guid.NewGuid();
        Guid instanceTwo = Guid.NewGuid();

        await repository.UpsertAsync(
            scope,
            CreateRecord(scope, instanceOne, inventorySnapshotId, controlId, new DateTime(2026, 10, 12, 12, 0, 0, DateTimeKind.Utc)));
        await repository.UpsertAsync(
            scope,
            CreateRecord(scope, instanceTwo, inventorySnapshotId, otherControlId));

        IReadOnlyList<VerifiedRemediationControlAssociationRecord> matches =
            await repository.ListByControlAndVerificationSnapshotIdsAsync(
                scope,
                controlId,
                [inventorySnapshotId, Guid.NewGuid()]);

        matches.Should().ContainSingle();
        matches[0].InstanceId.Should().Be(instanceOne);
    }

    private static ProjectScopeKey CreateScope() =>
        ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

    private static VerifiedRemediationControlAssociationRecord CreateRecord(
        ProjectScopeKey scope,
        Guid instanceId,
        Guid verificationSnapshotId,
        Guid controlId,
        DateTime? updatedUtc = null)
    {
        DateTime createdUtc = new(2026, 10, 12, 11, 0, 0, DateTimeKind.Utc);

        return new VerifiedRemediationControlAssociationRecord
        {
            AssociationId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            InstanceId = instanceId,
            VerificationSnapshotId = verificationSnapshotId,
            ControlId = controlId,
            AssessmentId = Guid.NewGuid(),
            CreatedUtc = createdUtc,
            UpdatedUtc = updatedUtc ?? createdUtc,
        };
    }
}
