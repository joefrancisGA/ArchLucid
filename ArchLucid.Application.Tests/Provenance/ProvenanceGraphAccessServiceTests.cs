using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Provenance;
using ArchLucid.Persistence.Queries;
using ArchLucid.Application.Provenance;
using ArchLucid.Provenance;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Provenance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProvenanceGraphAccessServiceTests
{
    [Fact]
    public async Task ResolveGraphAsync_uses_snapshot_when_revision_matches()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        RunDetailDto detail = CreateCompleteDetail(scope);
        ProvenanceBuildInput buildInput = ToBuildInput(detail);
        string revision = ProvenanceSnapshotRevisionHasher.Compute(buildInput, detail.Run.ArtifactBundleId);
        DecisionProvenanceGraph storedGraph = new() { RunId = detail.Run.RunId, Nodes = [], Edges = [] };
        string graphJson = ProvenanceGraphSerializer.Serialize(storedGraph);

        Mock<IProvenanceSnapshotRepository> repo = new();
        repo
            .Setup(r => r.GetByRunIdAsync(scope, detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot
            {
                RunId = detail.Run.RunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                GraphJson = graphJson,
                SourceRevisionHash = revision,
            });

        Mock<IProvenanceBuilder> builder = new();
        ProvenanceGraphAccessService sut = new(repo.Object, builder.Object, TimeProvider.System);

        DecisionProvenanceGraph? graph = await sut.ResolveGraphAsync(scope, detail, CancellationToken.None);

        graph.Should().NotBeNull();
        builder.Verify(b => b.Build(It.IsAny<ProvenanceBuildInput>()), Times.Never);
    }

    [Fact]
    public async Task TryMaterializeSnapshotAsync_persists_after_build()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        RunDetailDto detail = CreateCompleteDetail(scope);
        DecisionProvenanceGraph built = new() { RunId = detail.Run.RunId, Nodes = [], Edges = [] };

        Mock<IProvenanceSnapshotRepository> repo = new();
        repo
            .Setup(r => r.GetByRunIdAsync(scope, detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot?)null);
        repo
            .Setup(r => r.SaveAsync(It.IsAny<ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IProvenanceBuilder> builder = new();
        builder.Setup(b => b.Build(It.IsAny<ProvenanceBuildInput>())).Returns(built);

        ProvenanceGraphAccessService sut = new(repo.Object, builder.Object, TimeProvider.System);
        await sut.TryMaterializeSnapshotAsync(scope, detail, CancellationToken.None);

        repo.Verify(
            r => r.SaveAsync(
                It.Is<ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot>(s =>
                    s.RunId == detail.Run.RunId && !string.IsNullOrWhiteSpace(s.SourceRevisionHash)),
                It.IsAny<CancellationToken>(),
                null,
                null),
            Times.Once);
    }

    [Fact]
    public async Task ResolveGraphAsync_rebuilds_when_stored_revision_is_stale()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        RunDetailDto detail = CreateCompleteDetail(scope);
        DecisionProvenanceGraph storedGraph = new() { RunId = detail.Run.RunId, Nodes = [], Edges = [] };
        DecisionProvenanceGraph rebuiltGraph = new()
        {
            RunId = detail.Run.RunId,
            Nodes =
            [
                new ProvenanceNode
                {
                    Id = Guid.NewGuid(),
                    Type = ProvenanceNodeType.Manifest,
                    ReferenceId = detail.GoldenManifest!.ManifestId.ToString("D"),
                    Name = "Manifest",
                },
            ],
            Edges = [],
        };

        Mock<IProvenanceSnapshotRepository> repo = new();
        repo
            .Setup(r => r.GetByRunIdAsync(scope, detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot
            {
                RunId = detail.Run.RunId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                GraphJson = ProvenanceGraphSerializer.Serialize(storedGraph),
                SourceRevisionHash = "stale-hash",
            });
        repo
            .Setup(r => r.SaveAsync(It.IsAny<ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot>(), It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);

        Mock<IProvenanceBuilder> builder = new();
        builder.Setup(b => b.Build(It.IsAny<ProvenanceBuildInput>())).Returns(rebuiltGraph);

        ProvenanceGraphAccessService sut = new(repo.Object, builder.Object, TimeProvider.System);

        DecisionProvenanceGraph? graph = await sut.ResolveGraphAsync(scope, detail, CancellationToken.None);

        graph.Should().NotBeNull();
        graph!.Nodes.Should().ContainSingle();
        builder.Verify(b => b.Build(It.IsAny<ProvenanceBuildInput>()), Times.Once);
        repo.Verify(
            r => r.SaveAsync(It.IsAny<ArchLucid.Contracts.Persistence.Data.DecisionProvenanceSnapshot>(), It.IsAny<CancellationToken>(), null, null),
            Times.Once);
    }

    private static RunDetailDto CreateCompleteDetail(ScopeContext scope)
    {
        Guid runId = Guid.NewGuid();
        Guid traceId = Guid.NewGuid();

        return new RunDetailDto
        {
            Run = new ArchLucid.Persistence.Models.RunRecord
            {
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ArtifactBundleId = Guid.NewGuid(),
            },
            FindingsSnapshot = new FindingsSnapshot
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = runId,
                GraphSnapshotId = Guid.NewGuid(),
            },
            GraphSnapshot = new GraphSnapshot
            {
                GraphSnapshotId = Guid.NewGuid(),
                RunId = runId,
            },
            GoldenManifest = new ManifestDocument
            {
                ManifestId = Guid.NewGuid(),
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
            },
            AuthorityTrace = new RuleAuditTraceDto
            {
                RuleAudit = new RuleAuditTracePayload
                {
                    DecisionTraceId = traceId,
                    RunId = runId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                },
            },
            ArtifactBundle = new ArtifactBundle { Artifacts = [] },
        };
    }

    private static ProvenanceBuildInput ToBuildInput(RunDetailDto detail)
    {
        return new ProvenanceBuildInput
        {
            RunId = detail.Run.RunId,
            Findings = detail.FindingsSnapshot!,
            Graph = detail.GraphSnapshot!,
            Manifest = detail.GoldenManifest!,
            DecisionTrace = detail.AuthorityTrace!,
            Artifacts = detail.ArtifactBundle?.Artifacts ?? [],
        };
    }
}
