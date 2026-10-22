using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Core.Tests.Persistence.Graph;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphSnapshotCommittedReuseResolverTests
{
    [Fact]
    public async Task TryResolveAsync_reuses_graph_when_architecture_version_id_has_outer_whitespace()
    {
        Guid runId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid architectureVersionId = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6");
        ContextSnapshot contextSnapshot = BuildContextSnapshot(contextId);
        ArchitectureKnowledgeModel knowledgeModel = BuildKnowledgeModel();
        GraphSnapshot stored = BuildGraphWithContextPins(
            contextId,
            runId,
            graphId,
            contextSnapshot,
            knowledgeModel,
            architectureVersionIdValue: $" {architectureVersionId} ");

        Mock<IGraphSnapshotRepository> repo = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        repo.Setup(r => r.GetByIdAsync(scope, graphId, It.IsAny<CancellationToken>())).ReturnsAsync(stored);

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            graphId,
            contextId,
            repo.Object,
            CancellationToken.None,
            contextSnapshot: contextSnapshot,
            knowledgeModel: knowledgeModel,
            expectedArchitectureVersionId: architectureVersionId);

        result.Should().NotBeNull();
        result!.ResolutionMode.Should().Be("reused_from_run_header");
        result.Snapshot.GraphSnapshotId.Should().Be(graphId);
    }

    [Fact]
    public async Task TryResolveAsync_reuses_graph_when_policy_pack_pins_hash_has_outer_whitespace()
    {
        Guid runId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        byte[] headerHash = Convert.FromHexString("A1B2C3D4E5F607182930A1B2C3D4E5F607182930A1B2C3D4E5F607182930A1B2");
        ContextSnapshot contextSnapshot = BuildContextSnapshot(contextId);
        ArchitectureKnowledgeModel knowledgeModel = BuildKnowledgeModel();
        GraphSnapshot stored = BuildGraphWithContextPins(
            contextId,
            runId,
            graphId,
            contextSnapshot,
            knowledgeModel,
            architectureVersionIdValue: null,
            policyPackPinsHash: $" {Convert.ToHexString(headerHash)} ");

        Mock<IGraphSnapshotRepository> repo = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        repo.Setup(r => r.GetByIdAsync(scope, graphId, It.IsAny<CancellationToken>())).ReturnsAsync(stored);

        RunRecord runHeader = new()
        {
            RunId = runId,
            PinnedPolicyPackIdsHashSha256 = headerHash,
        };

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            graphId,
            contextId,
            repo.Object,
            CancellationToken.None,
            contextSnapshot: contextSnapshot,
            knowledgeModel: knowledgeModel,
            runHeader: runHeader);

        result.Should().NotBeNull();
        result!.ResolutionMode.Should().Be("reused_from_run_header");
    }

    [Fact]
    public async Task TryResolveAsync_reuses_graph_when_context_fingerprint_has_outer_whitespace()
    {
        Guid runId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        ContextSnapshot contextSnapshot = BuildContextSnapshot(contextId);
        ArchitectureKnowledgeModel knowledgeModel = BuildKnowledgeModel();
        string expectedFingerprint = GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot);
        GraphSnapshot stored = BuildGraphWithContextPins(
            contextId,
            runId,
            graphId,
            contextSnapshot,
            knowledgeModel,
            contextFingerprint: $" {expectedFingerprint} ");

        Mock<IGraphSnapshotRepository> repo = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        repo.Setup(r => r.GetByIdAsync(scope, graphId, It.IsAny<CancellationToken>())).ReturnsAsync(stored);

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            graphId,
            contextId,
            repo.Object,
            CancellationToken.None,
            contextSnapshot: contextSnapshot,
            knowledgeModel: knowledgeModel);

        result.Should().NotBeNull();
        result!.ResolutionMode.Should().Be("reused_from_run_header");
    }

    [Fact]
    public async Task TryResolveAsync_reuses_graph_when_knowledge_model_fingerprint_has_outer_whitespace()
    {
        Guid runId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        ContextSnapshot contextSnapshot = BuildContextSnapshot(contextId);
        ArchitectureKnowledgeModel knowledgeModel = BuildKnowledgeModel();
        string expectedFingerprint =
            GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(knowledgeModel);
        GraphSnapshot stored = BuildGraphWithContextPins(
            contextId,
            runId,
            graphId,
            contextSnapshot,
            knowledgeModel,
            knowledgeModelFingerprint: $" {expectedFingerprint} ");

        Mock<IGraphSnapshotRepository> repo = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        repo.Setup(r => r.GetByIdAsync(scope, graphId, It.IsAny<CancellationToken>())).ReturnsAsync(stored);

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            graphId,
            contextId,
            repo.Object,
            CancellationToken.None,
            contextSnapshot: contextSnapshot,
            knowledgeModel: knowledgeModel);

        result.Should().NotBeNull();
        result!.ResolutionMode.Should().Be("reused_from_run_header");
    }

    private static ContextSnapshot BuildContextSnapshot(Guid contextSnapshotId)
    {
        return new ContextSnapshot
        {
            SnapshotId = contextSnapshotId,
            RunId = Guid.NewGuid(),
            ProjectId = "proj",
            CreatedUtc = DateTime.UtcNow,
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = "a",
                    ObjectType = "type",
                    Name = "A",
                    SourceType = "src",
                    SourceId = "1",
                },
            ],
        };
    }

    private static ArchitectureKnowledgeModel BuildKnowledgeModel()
    {
        DateTime utcNow = DateTime.UtcNow;

        return new ArchitectureKnowledgeModel
        {
            ModelId = "km-test",
            TenantId = "tenant-test",
            SchemaVersion = 1,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
            Elements = [],
        };
    }

    private static GraphSnapshot BuildGraphWithContextPins(
        Guid contextSnapshotId,
        Guid runId,
        Guid graphId,
        ContextSnapshot contextSnapshot,
        ArchitectureKnowledgeModel knowledgeModel,
        string? architectureVersionIdValue = null,
        string? policyPackPinsHash = null,
        string? contextFingerprint = null,
        string? knowledgeModelFingerprint = null)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["contextCanonicalFingerprint"] = contextFingerprint
                ?? GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot),
            ["knowledgeModelFingerprint"] = knowledgeModelFingerprint
                ?? GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(knowledgeModel),
        };

        if (architectureVersionIdValue is not null)
            properties["architectureVersionId"] = architectureVersionIdValue;

        if (policyPackPinsHash is not null)
            properties["policyPackPinsHashSha256Hex"] = policyPackPinsHash;

        return new GraphSnapshot
        {
            GraphSnapshotId = graphId,
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx",
                    NodeType = "ContextSnapshot",
                    Label = "Context",
                    Properties = properties,
                },
            ],
        };
    }
}
