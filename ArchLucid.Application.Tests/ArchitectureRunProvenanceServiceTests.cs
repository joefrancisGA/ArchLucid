using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests;
[Trait("Category", "Unit")]

public sealed class ArchitectureRunProvenanceServiceTests
{
    [SkippableFact]
    public async Task GetProvenanceAsync_WhenRunMissing_ReturnsNull()
    {
        Mock<IRunDetailQueryService> detail = new();
        detail.Setup(d => d.GetRunDetailAsync("x", CancellationToken.None)).ReturnsAsync((ArchitectureRunDetail?)null);

        ArchitectureRunProvenanceService sut = new(
            detail.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            Mock.Of<IEvidenceBundleRepository>(),
            Mock.Of<IDecisionNodeRepository>());

        ArchitectureRunProvenanceGraph? graph = await sut.GetProvenanceAsync("x");

        graph.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetProvenanceAsync_BuildsRequestRunTaskResultAndTimeline()
    {
        const string runId = "run1";
        const string requestId = "req1";

        ArchitectureRunDetail loaded = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                RequestId = requestId,
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            Tasks =
            [
                new AgentTask
                {
                    TaskId = "t1",
                    RunId = runId,
                    AgentType = AgentType.Topology,
                    Objective = "Do topology",
                    Status = AgentTaskStatus.Completed,
                    CreatedUtc = new DateTime(2026, 1, 1, 1, 0, 0, DateTimeKind.Utc),
                    EvidenceBundleRef = "eb1"
                }
            ],
            Results =
            [
                new AgentResult
                {
                    ResultId = "res1",
                    TaskId = "t1",
                    RunId = runId,
                    AgentType = AgentType.Topology,
                    CreatedUtc = new DateTime(2026, 1, 1, 2, 0, 0, DateTimeKind.Utc)
                }
            ],
            Manifest = new GoldenManifest
            {
                RunId = runId,
                SystemName = "S",
                Metadata = new ManifestMetadata
                {
                    ManifestVersion = "v1-run1", CreatedUtc = new DateTime(2026, 1, 1, 3, 0, 0, DateTimeKind.Utc), DecisionTraceIds = ["tr1"]
                }
            },
            DecisionTraces =
            [
                RunEventTraceDto.From(
                    new RunEventTracePayload
                    {
                        TraceId = "tr1",
                        RunId = runId,
                        EventType = "Merged",
                        EventDescription = "done",
                        CreatedUtc = new DateTime(2026, 1, 1, 2, 30, 0, DateTimeKind.Utc)
                    })
            ]
        };

        Mock<IRunDetailQueryService> detail = new();
        detail.Setup(d => d.GetRunDetailAsync(runId, CancellationToken.None)).ReturnsAsync(loaded);

        Mock<IArchitectureRequestRepository> requests = new();
        requests.Setup(r => r.GetByIdAsync(requestId, CancellationToken.None))
            .ReturnsAsync(
                new Contracts.Requests.ArchitectureRequest { RequestId = requestId, SystemName = "Sys", Environment = "prod", Description = "12345678901" });

        Mock<IEvidenceBundleRepository> bundles = new();
        bundles.Setup(b => b.GetByIdAsync("eb1", CancellationToken.None))
            .ReturnsAsync(new EvidenceBundle { EvidenceBundleId = "eb1" });

        Mock<IDecisionNodeRepository> decisions = new();
        decisions.Setup(d => d.GetByRunIdAsync(runId, CancellationToken.None))
            .ReturnsAsync(
                new List<DecisionNodeRecord>
                {
                    new()
                    {
                        DecisionId = "d1",
                        RunId = runId,
                        Topic = "TopologyAcceptance",
                        CreatedUtc = new DateTime(2026, 1, 1, 2, 45, 0, DateTimeKind.Utc)
                    }
                });

        ArchitectureRunProvenanceService sut = new(
            detail.Object,
            requests.Object,
            bundles.Object,
            decisions.Object);

        ArchitectureRunProvenanceGraph? graph = await sut.GetProvenanceAsync(runId);

        graph.Should().NotBeNull();
        graph.RunId.Should().Be(runId);
        graph.TraceabilityGaps.Should().BeEmpty();
        graph.Nodes.Should().Contain(n => n.Type == ArchitectureLinkageKinds.Nodes.Request);
        graph.Nodes.Should().Contain(n => n.Type == ArchitectureLinkageKinds.Nodes.Run);
        graph.Nodes.Should().Contain(n => n.Type == ArchitectureLinkageKinds.Nodes.AgentTask);
        graph.Nodes.Should().Contain(n => n.Type == ArchitectureLinkageKinds.Nodes.AgentResult);
        graph.Nodes.Should().Contain(n => n.Type == ArchitectureLinkageKinds.Nodes.ManifestVersion);
        graph.Timeline.Should().NotBeEmpty();
        graph.Timeline.Select(t => t.Kind).Should().Contain(ArchitectureLinkageKinds.Timeline.TraceEvent);
    }

    [Fact]
    public async Task CompareQuality_GetProvenanceAsync_merges_decision_nodes_when_rows_are_split_across_alternate_run_id_keys()
    {
        const string canonicalRunId = "bcbcbcbcbcbcbcbcbcbcbcbcbcbcbcbc";
        const string legacyUpperRunId = "BCBCBCBCBCBCBCBCBCBCBCBCBCBCBCBC";
        const string requestId = "req-provenance-decision-merge";

        ArchitectureRunDetail loaded = new()
        {
            Run = new ArchitectureRun
            {
                RunId = canonicalRunId,
                RequestId = requestId,
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            Tasks = [],
            Results = [],
            Manifest = new GoldenManifest
            {
                RunId = canonicalRunId,
                SystemName = "S",
                Metadata = new ManifestMetadata
                {
                    ManifestVersion = "v1",
                    CreatedUtc = new DateTime(2026, 1, 1, 1, 0, 0, DateTimeKind.Utc),
                },
            },
        };

        Mock<IRunDetailQueryService> detail = new();
        detail
            .Setup(d => d.GetRunDetailAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(loaded);

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new Contracts.Requests.ArchitectureRequest
                {
                    RequestId = requestId,
                    SystemName = "Sys",
                    Environment = "prod",
                    Description = "12345678901",
                });

        Mock<IEvidenceBundleRepository> bundles = new();

        DecisionNodeRecord legacyKeyed = new()
        {
            DecisionId = "decision-legacy-repo-key",
            RunId = legacyUpperRunId,
            Topic = "SecurityGate",
            CreatedUtc = new DateTime(2026, 1, 1, 2, 0, 0, DateTimeKind.Utc),
        };

        Mock<IDecisionNodeRepository> decisions = new();
        decisions
            .Setup(d => d.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyKeyed]);
        decisions
            .Setup(d => d.GetByRunIdAsync(
                It.Is<string>(id => id != canonicalRunId),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        ArchitectureRunProvenanceService sut = new(
            detail.Object,
            requests.Object,
            bundles.Object,
            decisions.Object);

        ArchitectureRunProvenanceGraph? graph = await sut.GetProvenanceAsync(canonicalRunId);

        graph.Should().NotBeNull();
        graph!.Nodes.Should()
            .Contain(n => n.Type == ArchitectureLinkageKinds.Nodes.DecisionNode
                && n.ReferenceId == "decision-legacy-repo-key");
    }

    [SkippableFact]
    public async Task GetProvenanceAsync_uses_system_name_honesty_when_request_name_missing()
    {
        const string runId = "run-no-system-name";
        const string requestId = "req-no-system-name";

        ArchitectureRunDetail loaded = new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                RequestId = requestId,
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            Tasks = [],
            Results = [],
        };

        Mock<IRunDetailQueryService> detail = new();
        detail.Setup(d => d.GetRunDetailAsync(runId, CancellationToken.None)).ReturnsAsync(loaded);

        Mock<IArchitectureRequestRepository> requests = new();
        requests.Setup(r => r.GetByIdAsync(requestId, CancellationToken.None))
            .ReturnsAsync(new Contracts.Requests.ArchitectureRequest { RequestId = requestId, SystemName = "  " });

        ArchitectureRunProvenanceService sut = new(
            detail.Object,
            requests.Object,
            Mock.Of<IEvidenceBundleRepository>(),
            Mock.Of<IDecisionNodeRepository>());

        ArchitectureRunProvenanceGraph? graph = await sut.GetProvenanceAsync(runId);

        graph.Should().NotBeNull();
        graph!.Nodes.Should().Contain(n =>
            n.Type == ArchitectureLinkageKinds.Nodes.Request && n.Name == "System name was not stored.");
    }
}
