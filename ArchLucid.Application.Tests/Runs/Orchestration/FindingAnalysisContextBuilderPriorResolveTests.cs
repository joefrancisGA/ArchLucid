using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingAnalysisContextBuilderPriorResolveTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task BuildAsync_first_review_leaves_prior_null_when_no_architecture_prior()
    {
        Guid architectureId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        byte[] contentHash = [0x01, 0x02, 0x03];
        Guid currentRunId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 9, 9, 12, 0, 0, DateTimeKind.Utc);

        InMemoryArchitectureVersionRepository versions = new();
        await versions.CreateAsync(
            TestScope,
            new ArchitectureVersionRecord
            {
                ArchitectureVersionId = versionId,
                ArchitectureId = architectureId,
                VersionNumber = 1,
                ContentHashSha256 = contentHash,
            },
            CancellationToken.None);

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            CreateRunHeader(
                currentRunId,
                architectureId,
                versionId,
                contentHash,
                createdUtc,
                graphSnapshotId: Guid.NewGuid()),
            CancellationToken.None);

        FindingAnalysisContextBuilder sut = CreateBuilder(runs, versions);
        ContextSnapshot snapshot = new() { SnapshotId = Guid.NewGuid(), RunId = currentRunId };

        FindingAnalysisContext context = await sut.BuildAsync(
            TestScope,
            currentRunId,
            snapshot,
            knowledgeModel: null,
            request: null,
            CancellationToken.None);

        context.Prior.Should().BeNull();
    }

    [Fact]
    public async Task BuildAsync_second_review_same_version_resolves_prior_from_architecture_committed_run()
    {
        Guid architectureId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        byte[] contentHash = [0x0A, 0x0B, 0x0C];
        Guid priorRunId = Guid.NewGuid();
        Guid priorGraphSnapshotId = Guid.NewGuid();
        Guid currentRunId = Guid.NewGuid();
        DateTime priorCreatedUtc = new(2026, 9, 8, 12, 0, 0, DateTimeKind.Utc);
        DateTime currentCreatedUtc = priorCreatedUtc.AddHours(2);

        InMemoryArchitectureVersionRepository versions = new();
        await versions.CreateAsync(
            TestScope,
            new ArchitectureVersionRecord
            {
                ArchitectureVersionId = versionId,
                ArchitectureId = architectureId,
                VersionNumber = 1,
                ContentHashSha256 = contentHash,
            },
            CancellationToken.None);

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            CreateCommittedRunHeader(
                priorRunId,
                architectureId,
                versionId,
                contentHash,
                priorCreatedUtc,
                priorGraphSnapshotId),
            CancellationToken.None);
        await runs.SaveAsync(
            CreateRunHeader(
                currentRunId,
                architectureId,
                versionId,
                contentHash,
                currentCreatedUtc,
                graphSnapshotId: Guid.NewGuid()),
            CancellationToken.None);

        FindingAnalysisContextBuilder sut = CreateBuilder(runs, versions);
        ContextSnapshot snapshot = new() { SnapshotId = Guid.NewGuid(), RunId = currentRunId };

        FindingAnalysisContext context = await sut.BuildAsync(
            TestScope,
            currentRunId,
            snapshot,
            knowledgeModel: null,
            request: null,
            CancellationToken.None);

        context.Prior.Should().NotBeNull();
        context.Prior!.PriorRunId.Should().Be(priorRunId);
        context.Prior.PriorGraphSnapshotId.Should().Be(priorGraphSnapshotId);
    }

    [Fact]
    public async Task BuildAsync_first_review_topology_security_drift_records_prior_run_snapshot_held_check()
    {
        Guid architectureId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        byte[] contentHash = [0x11, 0x12, 0x13];
        Guid currentRunId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 9, 9, 14, 0, 0, DateTimeKind.Utc);

        InMemoryArchitectureVersionRepository versions = new();
        await versions.CreateAsync(
            TestScope,
            new ArchitectureVersionRecord
            {
                ArchitectureVersionId = versionId,
                ArchitectureId = architectureId,
                VersionNumber = 1,
                ContentHashSha256 = contentHash,
            },
            CancellationToken.None);

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            CreateRunHeader(
                currentRunId,
                architectureId,
                versionId,
                contentHash,
                createdUtc,
                graphSnapshotId: Guid.NewGuid()),
            CancellationToken.None);

        FindingAnalysisContextBuilder builder = CreateBuilder(runs, versions);
        ContextSnapshot snapshot = new() { SnapshotId = Guid.NewGuid(), RunId = currentRunId };

        FindingAnalysisContext context = await builder.BuildAsync(
            TestScope,
            currentRunId,
            snapshot,
            knowledgeModel: null,
            request: null,
            CancellationToken.None);

        TopologySecurityDriftFindingEngine engine = CreateTopologySecurityDriftEngine(priorGraph: null);
        GraphSnapshot currentGraph = BuildSqlGraph(includeReplica: false);

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(currentGraph, context, CancellationToken.None);

        findings.Should().BeEmpty();
        context.HeldCheckLedger.Should().NotBeNull();
        context.HeldCheckLedger!.BuildRollup()
            .Should()
            .Contain(entry => entry.InputCode == HeldCheckInputCode.PriorRunSnapshot);
    }

    [Fact]
    public async Task BuildAsync_second_review_can_emit_topology_security_drift_without_hidden_flag()
    {
        Guid architectureId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        byte[] contentHash = [0x21, 0x22, 0x23];
        Guid priorRunId = Guid.NewGuid();
        Guid priorGraphSnapshotId = Guid.NewGuid();
        Guid currentRunId = Guid.NewGuid();
        DateTime priorCreatedUtc = new(2026, 9, 7, 10, 0, 0, DateTimeKind.Utc);
        DateTime currentCreatedUtc = priorCreatedUtc.AddDays(1);

        GraphSnapshot priorGraph = BuildSqlGraph(includeReplica: true, architectureVersionContentHash: contentHash);
        GraphSnapshot currentGraph = BuildSqlGraph(includeReplica: false, architectureVersionContentHash: contentHash);

        InMemoryArchitectureVersionRepository versions = new();
        await versions.CreateAsync(
            TestScope,
            new ArchitectureVersionRecord
            {
                ArchitectureVersionId = versionId,
                ArchitectureId = architectureId,
                VersionNumber = 1,
                ContentHashSha256 = contentHash,
            },
            CancellationToken.None);

        InMemoryRunRepository runs = new();
        await runs.SaveAsync(
            CreateCommittedRunHeader(
                priorRunId,
                architectureId,
                versionId,
                contentHash,
                priorCreatedUtc,
                priorGraphSnapshotId),
            CancellationToken.None);
        await runs.SaveAsync(
            CreateRunHeader(
                currentRunId,
                architectureId,
                versionId,
                contentHash,
                currentCreatedUtc,
                graphSnapshotId: Guid.NewGuid()),
            CancellationToken.None);

        FindingAnalysisContextBuilder builder = CreateBuilder(runs, versions);
        ContextSnapshot snapshot = new() { SnapshotId = Guid.NewGuid(), RunId = currentRunId };

        FindingAnalysisContext context = await builder.BuildAsync(
            TestScope,
            currentRunId,
            snapshot,
            knowledgeModel: null,
            request: null,
            CancellationToken.None);

        TopologySecurityDriftFindingEngine engine = CreateTopologySecurityDriftEngine(priorGraph);
        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(currentGraph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("topology-security-drift");
        finding.Payload.Should().BeOfType<TopologySecurityDriftFindingPayload>()
            .Which.Kind.Should().Be(TopologySecurityDriftFindingPayloadKind.ReplicaOrFailoverRemoved);
    }

    [Fact]
    public async Task BuildAsync_sample_run_without_prior_stays_sample_safe()
    {
        Guid architectureId = Guid.NewGuid();
        Guid versionId = Guid.NewGuid();
        byte[] contentHash = [0x31, 0x32, 0x33];
        Guid currentRunId = Guid.NewGuid();
        DateTime createdUtc = new(2026, 9, 9, 16, 0, 0, DateTimeKind.Utc);

        InMemoryArchitectureVersionRepository versions = new();
        await versions.CreateAsync(
            TestScope,
            new ArchitectureVersionRecord
            {
                ArchitectureVersionId = versionId,
                ArchitectureId = architectureId,
                VersionNumber = 1,
                ContentHashSha256 = contentHash,
            },
            CancellationToken.None);

        InMemoryRunRepository runs = new();
        RunRecord sampleRun = CreateRunHeader(
            currentRunId,
            architectureId,
            versionId,
            contentHash,
            createdUtc,
            graphSnapshotId: Guid.NewGuid());
        sampleRun.IsSample = true;
        await runs.SaveAsync(sampleRun, CancellationToken.None);

        FindingAnalysisContextBuilder builder = CreateBuilder(runs, versions);
        ContextSnapshot snapshot = new() { SnapshotId = Guid.NewGuid(), RunId = currentRunId };

        FindingAnalysisContext context = await builder.BuildAsync(
            TestScope,
            currentRunId,
            snapshot,
            knowledgeModel: null,
            request: null,
            CancellationToken.None);

        context.Prior.Should().BeNull();
    }

    private static FindingAnalysisContextBuilder CreateBuilder(
        InMemoryRunRepository runs,
        InMemoryArchitectureVersionRepository versions)
    {
        Mock<IRunPolicyPackPinService> policyPackPins = new();
        policyPackPins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunEvidencePackagePinService> evidencePins = new();
        evidencePins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        evidencePins
            .Setup(service => service.ResolvePinsFromHeader(It.IsAny<RunRecord?>()))
            .Returns([]);
        evidencePins
            .Setup(service => service.HasCreateTimePinCommitment(It.IsAny<RunRecord?>()))
            .Returns(false);

        return new FindingAnalysisContextBuilder(
            runs,
            versions,
            Mock.Of<IPolicyPackVersionRepository>(),
            evidencePins.Object,
            policyPackPins.Object);
    }

    private static RunRecord CreateRunHeader(
        Guid runId,
        Guid architectureId,
        Guid architectureVersionId,
        byte[] contentHash,
        DateTime createdUtc,
        Guid graphSnapshotId) =>
        new()
        {
            RunId = runId,
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            ProjectId = "default",
            ArchitectureId = architectureId,
            ArchitectureVersionId = architectureVersionId,
            PinnedArchitectureVersionContentHashSha256 = (byte[])contentHash.Clone(),
            GraphSnapshotId = graphSnapshotId,
            PinnedPolicyPackIdsJson = "[]",
            CreatedUtc = createdUtc,
        };

    private static RunRecord CreateCommittedRunHeader(
        Guid runId,
        Guid architectureId,
        Guid architectureVersionId,
        byte[] contentHash,
        DateTime createdUtc,
        Guid graphSnapshotId)
    {
        RunRecord header = CreateRunHeader(
            runId,
            architectureId,
            architectureVersionId,
            contentHash,
            createdUtc,
            graphSnapshotId);
        header.LegacyRunStatus = "Committed";
        header.GoldenManifestId = Guid.NewGuid();
        header.CompletedUtc = createdUtc.AddMinutes(5);
        header.FindingsSnapshotId = Guid.NewGuid();
        return header;
    }

    private static TopologySecurityDriftFindingEngine CreateTopologySecurityDriftEngine(GraphSnapshot? priorGraph)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IGraphSnapshotRepository> graphSnapshots = new();
        graphSnapshots
            .Setup(repository => repository.GetByIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(priorGraph);

        return new TopologySecurityDriftFindingEngine(graphSnapshots.Object, scopeProvider.Object);
    }

    private static GraphSnapshot BuildSqlGraph(bool includeReplica, byte[]? architectureVersionContentHash = null)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["terraformType"] = "azurerm_mssql_database",
        };

        if (includeReplica)
        {
            properties["geo_redundant"] = "enabled";
        }

        Dictionary<string, string> contextProperties = new(StringComparer.OrdinalIgnoreCase);

        if (architectureVersionContentHash is { Length: > 0 })
        {
            contextProperties[ContextGraphPropertyKeys.ArchitectureVersionContentHashSha256Hex] =
                RunHeaderPinFingerprint.ToHexOrNull(architectureVersionContentHash)!;
        }

        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "prior-context",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "prior-context",
                    Properties = contextProperties,
                },
                new GraphNode
                {
                    NodeId = "sql-prod",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "prod-sql",
                    Properties = properties,
                },
            ],
        };
    }
}
