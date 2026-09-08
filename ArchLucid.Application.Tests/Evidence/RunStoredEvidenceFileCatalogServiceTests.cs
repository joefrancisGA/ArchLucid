using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Evidence;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Evidence;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunStoredEvidenceFileCatalogServiceTests
{
    [Fact]
    public async Task ListForRunAsync_when_run_missing_returns_null()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = CreateScope();
        InMemoryRunRepository runs = new();
        InMemoryRunStoredEvidenceFileRepository catalog = new();
        RunStoredEvidenceFileCatalogService service = CreateService(scope, runs, catalog);

        IReadOnlyList<RunStoredEvidenceFileDto>? result =
            await service.ListForRunAsync(runId, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ListForRunAsync_when_run_exists_without_catalog_returns_empty()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = CreateScope();
        InMemoryRunRepository runs = new();
        InMemoryRunStoredEvidenceFileRepository catalog = new();

        await SeedRunAsync(runs, scope, runId);

        RunStoredEvidenceFileCatalogService service = CreateService(scope, runs, catalog);

        IReadOnlyList<RunStoredEvidenceFileDto>? result =
            await service.ListForRunAsync(runId, CancellationToken.None);

        result.Should().NotBeNull();
        result!.Should().BeEmpty();
    }

    [Fact]
    public async Task ListForRunAsync_returns_catalog_rows_for_scoped_run()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = CreateScope();
        InMemoryRunRepository runs = new();
        InMemoryRunStoredEvidenceFileRepository catalog = new();

        await SeedRunAsync(runs, scope, runId);

        RunStoredEvidenceFileRecord row = new()
        {
            EvidenceItemId = Guid.NewGuid().ToString("N"),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            RunId = runId,
            OriginalFileName = "handbook.docx",
            ContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ByteLength = 4096,
            BlobUri = "artifacts/evidence/blob",
            CreatedUtc = DateTime.UtcNow,
            ActorUserId = "operator@test",
        };

        await catalog.InsertAsync(row, CancellationToken.None);

        RunStoredEvidenceFileCatalogService service = CreateService(scope, runs, catalog);

        IReadOnlyList<RunStoredEvidenceFileDto>? result =
            await service.ListForRunAsync(runId, CancellationToken.None);

        result.Should().NotBeNull();
        result!.Should().ContainSingle();
        result[0].EvidenceItemId.Should().Be(row.EvidenceItemId);
        result[0].OriginalFileName.Should().Be("handbook.docx");
        result[0].ByteLength.Should().Be(4096);
        result[0].ContentType.Should().Be(row.ContentType);
        result[0].CreatedUtc.Should().Be(row.CreatedUtc);
    }

    [Fact]
    public async Task ListForRunAsync_does_not_return_rows_from_other_tenant_scope()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext ownerScope = CreateScope();
        ScopeContext foreignScope = CreateScope();
        InMemoryRunRepository runs = new();
        InMemoryRunStoredEvidenceFileRepository catalog = new();

        await SeedRunAsync(runs, ownerScope, runId);

        RunStoredEvidenceFileRecord row = new()
        {
            EvidenceItemId = Guid.NewGuid().ToString("N"),
            TenantId = ownerScope.TenantId,
            WorkspaceId = ownerScope.WorkspaceId,
            ScopeProjectId = ownerScope.ProjectId,
            RunId = runId,
            OriginalFileName = "handbook.docx",
            ContentType = "application/octet-stream",
            ByteLength = 12,
            BlobUri = "artifacts/evidence/blob",
            CreatedUtc = DateTime.UtcNow,
            ActorUserId = "operator@test",
        };

        await catalog.InsertAsync(row, CancellationToken.None);

        RunStoredEvidenceFileCatalogService foreignService = CreateService(foreignScope, runs, catalog);

        IReadOnlyList<RunStoredEvidenceFileDto>? result =
            await foreignService.ListForRunAsync(runId, CancellationToken.None);

        result.Should().BeNull("foreign tenant scope must not resolve another tenant's run.");
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

    private static async Task SeedRunAsync(InMemoryRunRepository runs, ScopeContext scope, Guid runId)
    {
        await runs.SaveAsync(
            new RunRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = runId,
                ProjectId = "retail-api",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);
    }

    private static RunStoredEvidenceFileCatalogService CreateService(
        ScopeContext scope,
        InMemoryRunRepository runs,
        InMemoryRunStoredEvidenceFileRepository catalog)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        return new RunStoredEvidenceFileCatalogService(scopeProvider.Object, runs, catalog);
    }
}
