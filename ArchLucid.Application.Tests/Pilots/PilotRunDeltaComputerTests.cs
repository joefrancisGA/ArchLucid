using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Pilots;
using ArchLucid.Application.Roi;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class PilotRunDeltaComputerTests
{
    [SkippableFact]
    public async Task ComputeAsync_WhenCommittedAndScoped_PopulatesEveryDelta()
    {
        Guid runGuid = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);

        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        Mock<IAuditRepository> audit = new();
        Mock<IScopeContextProvider> scope = new();

        ScopeContext sc = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        scope.Setup(s => s.GetCurrentScope()).Returns(sc);

        traces.Setup(t => t.GetByRunIdAsync(detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new AgentExecutionTrace { TraceId = "t-1" },
                new AgentExecutionTrace { TraceId = "t-2" },
                new AgentExecutionTrace { TraceId = "t-3" },
            ]);

        audit.Setup(a => a.CountFilteredAsync(
                sc.TenantId,
                sc.WorkspaceId,
                sc.ProjectId,
                It.Is<AuditEventFilter>(f => f.RunId == runGuid),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);

        FindingEvidenceChainResponse chain = new()
        {
            RunId = detail.Run.RunId,
            FindingId = "top-finding",
            ManifestVersion = "v9",
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
        };

        evidence.Setup(e => e.BuildAsync(detail.Run.RunId, "top-finding", It.IsAny<CancellationToken>()))
            .ReturnsAsync(chain);

        PilotRunDeltaComputer sut =
            CreatePilotDeltaComputer(evidence.Object, traces.Object, audit.Object, LooseArtifacts().Object, scope.Object);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.RunCreatedUtc.Should().Be(detail.Run.CreatedUtc);
        result.ManifestCommittedUtc.Should().Be(detail.Manifest!.Metadata.CreatedUtc);
        result.TimeToCommittedManifest.Should().Be(TimeSpan.FromMinutes(15));
        result.LlmCallCount.Should().Be(3);
        result.LlmCallCountResolved.Should().BeTrue();
        result.AuditRowCount.Should().Be(2);
        result.AuditRowCountTruncated.Should().BeFalse();
        result.FindingsBySeverity.Should().ContainInOrder(
            new KeyValuePair<string, int>("Warning", 2),
            new KeyValuePair<string, int>("Error", 1));
        result.TopFindingId.Should().Be("top-finding");
        result.TopFindingSeverity.Should().Be("Error");
        result.TopFindingEvidenceChain.Should().Be(chain);
        result.IsDemoTenant.Should().BeFalse();
        result.SynthesizedArtifactDescriptorCountResolved.Should().BeFalse();
        result.SynthesizedArtifactDescriptorCount.Should().BeNull();
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenRunIsCanonicalDemoBaseline_FlagsIsDemoTenant()
    {
        Guid runGuid = ContosoRetailDemoIdentifiers.AuthorityRunBaselineId;
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);
        detail.Run.RunId = ContosoRetailDemoIdentifiers.RunBaseline;

        PilotRunDeltaComputer sut = BuildSutWithEmptyDependencies(out _, out _);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.IsDemoTenant.Should().BeTrue();
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenRequestIdMatchesMultiTenantDemoPrefix_FlagsIsDemoTenant()
    {
        Guid runGuid = Guid.NewGuid();
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);
        detail.Run.RequestId = "req-contoso-demo-abc123def456";

        PilotRunDeltaComputer sut = BuildSutWithEmptyDependencies(out _, out _);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.IsDemoTenant.Should().BeTrue();
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenManyAuditRows_ReturnsExactCount()
    {
        Guid runGuid = Guid.Parse("bbbbbbbb-1111-2222-3333-444444444444");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);

        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        Mock<IAuditRepository> audit = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        traces.Setup(t => t.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(520);

        PilotRunDeltaComputer sut =
            CreatePilotDeltaComputer(evidence.Object, traces.Object, audit.Object, LooseArtifacts().Object, scope.Object);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.AuditRowCount.Should().Be(520);
        result.AuditRowCountTruncated.Should().BeFalse();
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenAuditRepositoryThrows_ReportsZeroAndContinues()
    {
        Guid runGuid = Guid.Parse("cccccccc-1111-2222-3333-444444444444");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);

        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        Mock<IAuditRepository> audit = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        traces.Setup(t => t.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store offline"));

        PilotRunDeltaComputer sut =
            CreatePilotDeltaComputer(evidence.Object, traces.Object, audit.Object, LooseArtifacts().Object, scope.Object);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.AuditRowCount.Should().Be(0);
        result.AuditRowCountTruncated.Should().BeFalse();
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenTraceRepositoryThrows_MarksLlmCallCountUnresolved()
    {
        Guid runGuid = Guid.Parse("12121212-1111-2222-3333-444444444444");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);

        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces.Setup(t => t.GetByRunIdAsync(detail.Run.RunId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("traces offline"));
        Mock<IAuditRepository> audit = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        PilotRunDeltaComputer sut =
            CreatePilotDeltaComputer(evidence.Object, traces.Object, audit.Object, LooseArtifacts().Object, scope.Object);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.LlmCallCount.Should().Be(0);
        result.LlmCallCountResolved.Should().BeFalse();
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenNoFindings_LeavesEvidenceFieldsNull()
    {
        Guid runGuid = Guid.Parse("dddddddd-1111-2222-3333-444444444444");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);
        detail.Results = []; // No findings on this run.

        PilotRunDeltaComputer sut = BuildSutWithEmptyDependencies(out Mock<IAgentExecutionTraceRepository> traces,
            out Mock<IFindingEvidenceChainService> evidence);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.FindingsBySeverity.Should().BeEmpty();
        result.TopFindingId.Should().BeNull();
        result.TopFindingSeverity.Should().BeNull();
        result.TopFindingEvidenceChain.Should().BeNull();
        evidence.Verify(e => e.BuildAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        traces.Verify(t => t.GetByRunIdAsync(detail.Run.RunId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenManifestMissing_TimeToCommitIsNull()
    {
        Guid runGuid = Guid.Parse("eeeeeeee-1111-2222-3333-444444444444");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);
        detail.Manifest = null;

        PilotRunDeltaComputer sut = BuildSutWithEmptyDependencies(out _, out _);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.TimeToCommittedManifest.Should().BeNull();
        result.ManifestCommittedUtc.Should().BeNull();
    }

    [SkippableFact]
    public async Task ComputeAsync_NullDetail_Throws()
    {
        PilotRunDeltaComputer sut = BuildSutWithEmptyDependencies(out _, out _);

        Func<Task> act = () => sut.ComputeAsync(null!);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenEvidenceChainThrows_ReportsNullChainAndKeepsTopFindingId()
    {
        Guid runGuid = Guid.Parse("ffffffff-1111-2222-3333-444444444444");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);

        Mock<IFindingEvidenceChainService> evidence = new();
        evidence.Setup(e => e.BuildAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("chain unavailable"));

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces.Setup(t => t.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        PilotRunDeltaComputer sut =
            CreatePilotDeltaComputer(evidence.Object, traces.Object, audit.Object, LooseArtifacts().Object, scope.Object);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.TopFindingId.Should().NotBeNull();
        result.TopFindingEvidenceChain.Should().BeNull();
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenRunIdNotGuid_ReportsZeroAuditRowsWithoutQuerying()
    {
        ArchitectureRunDetail detail = BuildDetail(Guid.NewGuid(), isDemoSeed: false);
        detail.Run.RunId = "not-a-guid"; // Cannot map to dbo.AuditEvents.RunId.

        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces.Setup(t => t.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        Mock<IAuditRepository> audit = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        PilotRunDeltaComputer sut =
            CreatePilotDeltaComputer(evidence.Object, traces.Object, audit.Object, LooseArtifacts().Object, scope.Object);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.AuditRowCount.Should().Be(0);
        audit.Verify(a => a.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ComputeAsync_WhenGoldenManifestIdPresent_CountsArtifactDescriptors()
    {
        Guid runGuid = Guid.Parse("99999999-9999-9999-9999-999999999999");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);
        detail.Run.GoldenManifestId = manifestId;

        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces.Setup(t => t.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        Mock<IAuditRepository> audit = new();
        Mock<IScopeContextProvider> scope = new();
        ScopeContext sc = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        scope.Setup(s => s.GetCurrentScope()).Returns(sc);
        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        evidence.Setup(e => e.BuildAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((FindingEvidenceChainResponse?)null);

        Mock<IArtifactQueryService> artifacts = new();
        IReadOnlyList<ArtifactDescriptor> two =
        [
            new()
            {
                ArtifactId = Guid.NewGuid(),
                ArtifactType = "Doc",
                Name = "a",
                Format = "md",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                ContentHash = "h1",
            },
            new()
            {
                ArtifactId = Guid.NewGuid(),
                ArtifactType = "Doc",
                Name = "b",
                Format = "md",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                ContentHash = "h2",
            },
        ];
        artifacts.Setup(a => a.ListArtifactsByManifestIdAsync(sc, manifestId, It.IsAny<CancellationToken>())).ReturnsAsync(two);

        PilotRunDeltaComputer sut =
            CreatePilotDeltaComputer(evidence.Object, traces.Object, audit.Object, artifacts.Object, scope.Object);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.SynthesizedArtifactDescriptorCountResolved.Should().BeTrue();
        result.SynthesizedArtifactDescriptorCount.Should().Be(2);
    }

    [Fact]
    public async Task ComputeAsync_WhenPilotStrictAndAggregatorFails_PosturesViolatesSponsorEvidence()
    {
        Guid runGuid = Guid.Parse("bbbbbbbb-1111-2222-3333-444444444444");
        ArchitectureRunDetail detail = BuildDetail(runGuid, isDemoSeed: false);

        Mock<IFindingEvidenceChainService> evidence = new();
        Mock<IAgentExecutionTraceRepository> traces = new();
        traces.Setup(t => t.GetByRunIdAsync(detail.Run.RunId, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        Mock<IAuditRepository> audit = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        Mock<IRunAgentOutputPilotEvidenceAggregator> agg = new();
        agg.Setup(a =>
                a.WouldPilotStrictBlockSponsorEvidenceAsync(
                    It.IsAny<IReadOnlyList<AgentExecutionTrace>>(),
                    It.IsAny<RunExplanationSummary?>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        PilotRunDeltaComputer sut =
            CreatePilotDeltaComputer(
                evidence.Object,
                traces.Object,
                audit.Object,
                LooseArtifacts().Object,
                scope.Object,
                gateOpts: new AgentOutputQualityGateOptions { Enabled = true, Mode = AgentOutputQualityGateMode.PilotStrict },
                pilotAggregator: agg.Object);

        PilotRunDeltas result = await sut.ComputeAsync(detail);

        result.AgentOutputPilotStrictSignalsResolved.Should().BeTrue();
        result.AgentOutputPilotStrictViolatesSponsorEvidence.Should().BeTrue();
        agg.Verify(
            a => a.WouldPilotStrictBlockSponsorEvidenceAsync(
                It.IsAny<IReadOnlyList<AgentExecutionTrace>>(),
                It.IsAny<RunExplanationSummary?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static PilotRunDeltaComputer BuildSutWithEmptyDependencies(out Mock<IAgentExecutionTraceRepository> traces,
        out Mock<IFindingEvidenceChainService> evidence)
    {
        evidence = new Mock<IFindingEvidenceChainService>();
        traces = new Mock<IAgentExecutionTraceRepository>();
        traces.Setup(t => t.GetByRunIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        Mock<IAuditRepository> audit = new();
        audit.Setup(a => a.CountFilteredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });
        evidence.Setup(e => e.BuildAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((FindingEvidenceChainResponse?)null);

        return CreatePilotDeltaComputer(evidence.Object, traces.Object, audit.Object, LooseArtifacts().Object, scope.Object);
    }

    private static IRunAgentOutputPilotEvidenceAggregator DefaultStrictPilotAgg()
    {
        Mock<IRunAgentOutputPilotEvidenceAggregator> mock = new();
        mock.Setup(a =>
                a.WouldPilotStrictBlockSponsorEvidenceAsync(
                    It.IsAny<IReadOnlyList<AgentExecutionTrace>>(),
                    It.IsAny<RunExplanationSummary?>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        return mock.Object;
    }

    private static IAgentOutputQualityGateOptionsResolver CreateGateOptionsResolver(AgentOutputQualityGateOptions? gateOpts = null)
    {
        Mock<IAgentOutputQualityGateOptionsResolver> resolver = new();
        AgentOutputQualityGateOptions options = gateOpts ?? new AgentOutputQualityGateOptions();

        resolver.Setup(r => r.Resolve(It.IsAny<CancellationToken>())).Returns(options);

        return resolver.Object;
    }

    private static PilotRunDeltaComputer CreatePilotDeltaComputer(
        IFindingEvidenceChainService evidence,
        IAgentExecutionTraceRepository traces,
        IAuditRepository audit,
        IArtifactQueryService artifacts,
        IScopeContextProvider scope,
        AgentOutputQualityGateOptions? gateOpts = null,
        IRunAgentOutputPilotEvidenceAggregator? pilotAggregator = null,
        ITenantEstimatedUsdSavingsResolver? savingsResolver = null)
    {
        Mock<ITenantEstimatedUsdSavingsResolver> savings = new();
        savings
            .Setup(r => r.ResolveFromFindingsSnapshotIdAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((decimal?)null);

        return new PilotRunDeltaComputer(
            evidence,
            traces,
            audit,
            artifacts,
            savingsResolver ?? savings.Object,
            scope,
            Mock.Of<IRunExplanationSummaryService>(),
            pilotAggregator ?? DefaultStrictPilotAgg(),
            CreateGateOptionsResolver(gateOpts),
            NullLogger<PilotRunDeltaComputer>.Instance);
    }

    private static Mock<IArtifactQueryService> LooseArtifacts()
    {
        Mock<IArtifactQueryService> artifacts = new();
        artifacts.Setup(a => a.ListArtifactsByManifestIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        return artifacts;
    }

    private static ArchitectureRunDetail BuildDetail(Guid runGuid, bool isDemoSeed)
    {
        DateTime created = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        ArchitectureRun run = new()
        {
            RunId = runGuid.ToString("N"),
            RequestId = isDemoSeed ? ContosoRetailDemoIdentifiers.RequestContoso : "req-1",
            Status = ArchitectureRunStatus.Committed,
            CreatedUtc = created,
            CompletedUtc = created.AddMinutes(15),
            CurrentManifestVersion = "v9",
        };

        GoldenManifest manifest = new()
        {
            RunId = run.RunId,
            SystemName = "Demo",
            Metadata = new ManifestMetadata { ManifestVersion = "v9", CreatedUtc = created.AddMinutes(15) },
            Governance = new ManifestGovernance(),
        };

        AgentResult result = new()
        {
            TaskId = "t1",
            RunId = run.RunId,
            AgentType = AgentType.Topology,
            Findings =
            [
                new ArchitectureFinding { FindingId = "warn-1", Severity = FindingSeverity.Warning, Message = "m1" },
                new ArchitectureFinding { FindingId = "warn-2", Severity = FindingSeverity.Warning, Message = "m2" },
                new ArchitectureFinding { FindingId = "top-finding", Severity = FindingSeverity.Error, Message = "m3" },
            ],
        };

        return new ArchitectureRunDetail
        {
            Run = run,
            Manifest = manifest,
            Results = [result],
            DecisionTraces = [],
        };
    }
}
