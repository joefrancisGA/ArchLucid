using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Support;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Support;
using ArchLucid.Persistence.Transactions;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatch7Tests
{
    [Fact]
    public async Task InMemorySupportProblemReportRepository_round_trips_insert_get_and_blob_update()
    {
        InMemorySupportProblemReportRepository sut = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid explicitId = Guid.NewGuid();

        SupportProblemReportRecord inserted = await sut.InsertAsync(
            new SupportProblemReportInsert
            {
                Id = explicitId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = Guid.NewGuid(),
                SubmittedByActorId = "actor-1",
                ContextJson = """{"route":"/health/ready"}""",
                OperatorNote = "first pilot",
                CorrelationId = "corr-1",
                ClientRequestId = "req-1",
            },
            CancellationToken.None);

        inserted.Id.Should().Be(explicitId);
        inserted.Status.Should().Be(SupportProblemReportStatus.Open);
        inserted.SupportBundleBlobPath.Should().BeNull();

        SupportProblemReportRecord? loaded = await sut.GetByIdAsync(tenantId, explicitId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded!.OperatorNote.Should().Be("first pilot");

        SupportProblemReportRecord? updated = await sut.UpdateSupportBundleBlobPathAsync(
            tenantId,
            explicitId,
            "support-bundles/run-1.zip",
            CancellationToken.None);

        updated.Should().NotBeNull();
        updated!.SupportBundleBlobPath.Should().Be("support-bundles/run-1.zip");

        SupportProblemReportRecord? missingTenant = await sut.UpdateSupportBundleBlobPathAsync(
            Guid.NewGuid(),
            explicitId,
            "support-bundles/run-1.zip",
            CancellationToken.None);

        missingTenant.Should().BeNull();
    }

    [Fact]
    public async Task InMemorySupportProblemReportRepository_generates_id_and_validates_inputs()
    {
        InMemorySupportProblemReportRepository sut = new();
        Guid tenantId = Guid.NewGuid();

        SupportProblemReportRecord generated = await sut.InsertAsync(
            new SupportProblemReportInsert
            {
                TenantId = tenantId,
                WorkspaceId = Guid.NewGuid(),
                SubmittedByActorId = "actor",
                ContextJson = "{}",
            },
            CancellationToken.None);

        generated.Id.Should().NotBe(Guid.Empty);

        Func<Task> nullInsert = async () => await sut.InsertAsync(null!, CancellationToken.None);
        Func<Task> blankBlobPath = async () => await sut.UpdateSupportBundleBlobPathAsync(
            tenantId,
            generated.Id,
            " ",
            CancellationToken.None);

        await nullInsert.Should().ThrowAsync<ArgumentNullException>();
        await blankBlobPath.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task InMemoryFindingRecordMuteRepository_returns_empty_flags_and_rejects_mute()
    {
        InMemoryFindingRecordMuteRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        IReadOnlyDictionary<string, FindingMuteFlag> flags = await sut.GetMuteFlagsAsync(
            Guid.NewGuid(),
            scope,
            CancellationToken.None);

        flags.Should().BeEmpty();

        bool muted = await sut.TryMuteAsync(
            Guid.NewGuid(),
            "finding-1",
            "noise",
            scope,
            CancellationToken.None,
            expiresAtUtc: DateTimeOffset.UtcNow.AddDays(1));

        muted.Should().BeFalse();

        Func<Task> nullScope = async () => await sut.GetMuteFlagsAsync(Guid.NewGuid(), null!, CancellationToken.None);
        await nullScope.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task InMemoryArchLucidUnitOfWork_supports_commit_rollback_and_dispose()
    {
        InMemoryArchLucidUnitOfWork sut = new();

        await sut.CommitAsync(CancellationToken.None);
        await sut.RollbackAsync(CancellationToken.None);
        await sut.DisposeAsync();

        Action connection = () => _ = sut.Connection;
        Action transaction = () => _ = sut.Transaction;

        connection.Should().Throw<NotSupportedException>();
        transaction.Should().Throw<NotSupportedException>();
    }
}
