using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Repositories;

using FluentAssertions;

using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Tests.Repositories;

[Trait("Suite", "Core")]
public sealed class InMemoryGoldenManifestRepositoryTests
{
    private sealed class StubManifestHashService : IManifestHashService
    {
        public string ComputeHash(ManifestDocument manifest) =>
            $"stub:{manifest.ManifestId:N}";
    }

    [Fact]
    public async Task GetByContractManifestVersionAsync_null_scope_throws()
    {
        InMemoryGoldenManifestRepository sut = new();

        Func<Task> act = async () =>
            await sut.GetByContractManifestVersionAsync(null!, "v1", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("scope");
    }

    [Fact]
    public async Task GetByContractManifestVersionAsync_whitespace_version_throws()
    {
        InMemoryGoldenManifestRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        Func<Task> act = async () =>
            await sut.GetByContractManifestVersionAsync(scope, "   ", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>().WithParameterName("manifestVersion");
    }

    [Fact]
    public async Task GetByContractManifestVersionAsync_cancelled_throws()
    {
        InMemoryGoldenManifestRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        using CancellationTokenSource cts = new();
        await cts.CancelAsync();

        Func<Task> act = async () =>
            await sut.GetByContractManifestVersionAsync(scope, "v1", cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task SaveAsync_contract_overload_null_contract_throws()
    {
        InMemoryGoldenManifestRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        SaveContractsManifestOptions keying = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            RuleSetId = "r",
            RuleSetVersion = "1",
            RuleSetHash = "h"
        };

        Func<Task> act = async () =>
            await sut.SaveAsync(null!, scope, keying, new StubManifestHashService(), CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("contract");
    }

    [Fact]
    public async Task SaveAsync_contract_overload_persists_and_sets_hash()
    {
        InMemoryGoldenManifestRepository sut = new();
        Guid manifestId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd")
        };

        SaveContractsManifestOptions keying = new()
        {
            ManifestId = manifestId,
            RunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            ContextSnapshotId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            GraphSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            FindingsSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            DecisionTraceId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            CreatedUtc = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc)
        };

        Cm.GoldenManifest contract = new()
        {
            RunId = keying.RunId.ToString("D"),
            SystemName = "sys-under-test",
            Metadata = new Cm.ManifestMetadata { ManifestVersion = "coord-v7" },
            Governance = new Cm.ManifestGovernance()
        };

        ManifestDocument saved = await sut.SaveAsync(
            contract,
            scope,
            keying,
            new StubManifestHashService(),
            CancellationToken.None);

        saved.ManifestHash.Should().Be($"stub:{manifestId:N}");
        saved.Metadata.Version.Should().Be("coord-v7");

        ManifestDocument? byId = await sut.GetByIdAsync(scope, manifestId, CancellationToken.None);
        byId.Should().NotBeNull();
        byId!.ManifestHash.Should().Be($"stub:{manifestId:N}");

        ManifestDocument? byVersion = await sut.GetByContractManifestVersionAsync(scope, "coord-v7", CancellationToken.None);
        byVersion.Should().NotBeNull();
        byVersion!.ManifestId.Should().Be(manifestId);
    }

    [Fact]
    public async Task SaveAsync_document_cancelled_throws()
    {
        InMemoryGoldenManifestRepository sut = new();
        ManifestDocument doc = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid()
        };

        using CancellationTokenSource cts = new();
        cts.Cancel();

        Func<Task> act = async () => await sut.SaveAsync(doc, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task SupersedeUnreferencedActiveGoldenManifestsAsync_cancelled_throws()
    {
        InMemoryGoldenManifestRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        using CancellationTokenSource cts = new();
        cts.Cancel();

        Func<Task> act = async () =>
            await sut.SupersedeUnreferencedActiveGoldenManifestsAsync(
                scope,
                Guid.NewGuid(),
                connection: null,
                transaction: null,
                cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task SaveAsync_document_evicts_oldest_when_over_cap()
    {
        InMemoryGoldenManifestRepository sut = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
        };

        Guid firstId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        ManifestDocument Minimal(Guid manifestId)
        {
            Guid runId = Guid.NewGuid();

            return new ManifestDocument
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                ManifestId = manifestId,
                RunId = runId,
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                FindingsSnapshotId = Guid.NewGuid(),
                DecisionTraceId = Guid.NewGuid()
            };
        }

        await sut.SaveAsync(Minimal(firstId), CancellationToken.None);

        for (int i = 0; i < 501; i++)
            await sut.SaveAsync(Minimal(Guid.NewGuid()), CancellationToken.None);

        ManifestDocument? evicted = await sut.GetByIdAsync(scope, firstId, CancellationToken.None);
        evicted.Should().BeNull();
    }
}
