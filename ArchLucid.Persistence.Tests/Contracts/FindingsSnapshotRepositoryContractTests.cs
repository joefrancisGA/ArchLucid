using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Shared contract assertions for <see cref="IFindingsSnapshotRepository" /> tenant scope isolation.
/// </summary>
[Trait("Category", "Unit")]
public abstract class FindingsSnapshotRepositoryContractTests
{
    private static readonly Guid TenantId = Guid.Parse("c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1");
    private static readonly Guid WorkspaceId = Guid.Parse("c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2");
    private static readonly Guid ScopeProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");

    protected abstract IFindingsSnapshotRepository CreateRepository();

    protected virtual void SkipIfSqlServerUnavailable()
    {
    }

    private static ScopeContext NewScope()
    {
        return new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ScopeProjectId };
    }

    private static FindingsSnapshot NewSnapshot(Guid snapshotId, Guid runId)
    {
        return new FindingsSnapshot
        {
            FindingsSnapshotId = snapshotId,
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Findings =
            [
                new Finding
                {
                    FindingId = "contract-finding",
                    FindingType = "Security",
                    Category = "Security",
                    EngineType = "Test",
                    Severity = FindingSeverity.Warning,
                    Title = "contract",
                    Rationale = "contract",
                },
            ],
        };
    }

    [SkippableFact]
    public async Task Save_then_GetById_returns_snapshot()
    {
        SkipIfSqlServerUnavailable();
        IFindingsSnapshotRepository repo = CreateRepository();
        ScopeContext scope = NewScope();
        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        await repo.SaveAsync(NewSnapshot(snapshotId, runId), CancellationToken.None);

        FindingsSnapshot? loaded = await repo.GetByIdAsync(scope, snapshotId, CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.FindingsSnapshotId.Should().Be(snapshotId);
        loaded.RunId.Should().Be(runId);
    }

    [SkippableFact]
    public async Task GetById_wrong_scope_returns_null()
    {
        SkipIfSqlServerUnavailable();
        IFindingsSnapshotRepository repo = CreateRepository();
        Guid snapshotId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        await repo.SaveAsync(NewSnapshot(snapshotId, runId), CancellationToken.None);

        ScopeContext other = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = WorkspaceId,
            ProjectId = ScopeProjectId,
        };

        FindingsSnapshot? loaded = await repo.GetByIdAsync(other, snapshotId, CancellationToken.None);

        loaded.Should().BeNull();
    }
}
