using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Core.Findings;
using ArchLucid.KnowledgeGraph.Models;

using System.Text.Json;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Findings Orchestrator.
/// </summary>

[Trait("Suite", "Core")]
public sealed class FindingsOrchestratorTests
{
    private static readonly IInsightDensityGate InsightDensityGate = DeterministicInsightDensityGate.CreateDefault();

    private static GraphSnapshot EmptyGraph() => new()
    {
        GraphSnapshotId = Guid.NewGuid(),
        ContextSnapshotId = Guid.NewGuid(),
        RunId = Guid.NewGuid()
    };

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_NullGraph_Throws()
    {
        Mock<IFindingEngine> engine = new(MockBehavior.Strict);
        Mock<IFindingPayloadValidator> validator = new(MockBehavior.Strict);
        FindingsOrchestrator sut = new(
            [engine.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        await Assert.ThrowsAsync<ArgumentNullException>(
            () => sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), null!, CancellationToken.None));
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_CallsEachEngineOnce()
    {
        GraphSnapshot graph = EmptyGraph();
        Mock<IFindingEngine> e1 = CreateEngine("e1", "Security", []);
        Mock<IFindingEngine> e2 = CreateEngine("e2", "Topology", []);

        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = new(
            [e1.Object, e2.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        e1.Verify(x => x.AnalyzeAsync(graph, It.IsAny<CancellationToken>()), Times.Once);
        e2.Verify(x => x.AnalyzeAsync(graph, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_SingleEngineThrow_throws_AggregateException()
    {
        GraphSnapshot graph = EmptyGraph();
        Mock<IFindingEngine> e1 = new(MockBehavior.Strict);
        e1.Setup(x => x.EngineType).Returns("bad");
        e1.Setup(x => x.Category).Returns("Security");
        e1.Setup(x => x.AnalyzeAsync(graph, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        Mock<IFindingPayloadValidator> validator = new(MockBehavior.Strict);
        FindingsOrchestrator sut = new(
            [e1.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        AggregateException ax = await Assert.ThrowsAsync<AggregateException>(
            () => sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None));

        ax.InnerExceptions.Should().ContainSingle()
            .Which.Should().BeOfType<InvalidOperationException>();
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_PartialEngineFailure_still_returns_snapshot()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding ok = new()
        {
            FindingType = "T",
            Category = "Security",
            EngineType = "ok",
            Title = "ok-title",
            Rationale = "r",
            Severity = FindingSeverity.Info
        };

        Mock<IFindingEngine> bad = new(MockBehavior.Strict);
        bad.Setup(x => x.EngineType).Returns("bad");
        bad.Setup(x => x.Category).Returns("Security");
        bad.Setup(x => x.AnalyzeAsync(graph, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        Mock<IFindingEngine> good = CreateEngine("good", "Security", [ok]);

        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = new(
            [bad.Object, good.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        snapshot.Findings.Should().ContainSingle();
        snapshot.EngineFailures.Should().ContainSingle()
            .Which.EngineType.Should().Be("bad");
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_retains_generic_typed_engine_findings()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding generic = new()
        {
            FindingId = "generic-mfa",
            FindingType = "RequirementFinding",
            Category = "Security",
            EngineType = "requirement",
            Title = "Enable MFA for all user accounts.",
            Rationale = "Enable MFA for all user accounts.",
            Severity = FindingSeverity.Warning,
        };

        Mock<IFindingEngine> engine = CreateEngine("requirement", "Security", [generic]);
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = new(
            [engine.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        Finding finding = snapshot.Findings.Should().ContainSingle().Subject;
        finding.Treatment.Should().Be(FindingTreatment.Promote);
        finding.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        snapshot.ChecklistCoverage.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_applies_insight_density_gate_to_generic_agent_findings()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding generic = new()
        {
            FindingId = "generic-mfa",
            FindingType = "AgentArchitectureFinding-Critic",
            Category = "General",
            EngineType = "Critic",
            Title = "Enable MFA for all user accounts.",
            Rationale = "Enable MFA for all user accounts.",
            Severity = FindingSeverity.Warning,
        };

        Mock<IFindingEngine> engine = CreateEngine("ok", "General", [generic]);
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = new(
            [engine.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        snapshot.Findings.Should().BeEmpty();
        Finding finding = snapshot.ChecklistCoverage.Should().ContainSingle().Subject;
        finding.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
        finding.Classification.Should().Be(FindingClassification.ChecklistCoverage);
        finding.InsightDensityScore.Should().BeLessThan(50);
        finding.WhyThisIsNotGeneric.Should().BeNull();
        snapshot.InsightDensityCuration!.DemotedToChecklistCount.Should().Be(1);
        snapshot.InsightDensityCuration.RetainedFindingCount.Should().Be(0);
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_promotes_evidence_anchored_findings()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding anchored = new()
        {
            FindingId = "anchored",
            FindingType = "T",
            Category = "Security",
            EngineType = "ok",
            Title = "CheckoutApiUnderSpecified",
            Rationale = "CheckoutApiUnderSpecified",
            Severity = FindingSeverity.Warning,
            Trace = new ExplainabilityTrace
            {
                Notes = ["evidence:doc:manifest.json#services"],
            },
        };

        Mock<IFindingEngine> engine = CreateEngine("ok", "Security", [anchored]);
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = new(
            [engine.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        Finding finding = snapshot.Findings.Should().ContainSingle().Subject;
        finding.Treatment.Should().Be(FindingTreatment.Promote);
        finding.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        finding.InsightDensityScore.Should().BeGreaterThan(50);
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_OperationCanceledException_propagates()
    {
        GraphSnapshot graph = EmptyGraph();
        Mock<IFindingEngine> e1 = new(MockBehavior.Strict);
        e1.Setup(x => x.EngineType).Returns("bad");
        e1.Setup(x => x.Category).Returns("Security");
        e1.Setup(x => x.AnalyzeAsync(graph, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        Mock<IFindingPayloadValidator> validator = new(MockBehavior.Strict);
        FindingsOrchestrator sut = new(
            [e1.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None));
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_CategoryMismatch_Throws()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding badCategory = new()
        {
            FindingType = "X",
            Category = "Wrong",
            EngineType = "e1",
            Title = "t",
            Rationale = "r",
            Severity = FindingSeverity.Info
        };

        Mock<IFindingEngine> e1 = CreateEngine("e1", "Security", [badCategory]);
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = new(
            [e1.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None));
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_DeduplicatesByTypeAndTitle()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding a = new()
        {
            FindingType = "T",
            Category = "Security",
            EngineType = "e1",
            Title = "Same",
            Rationale = "r1",
            Severity = FindingSeverity.Warning
        };
        Finding b = new()
        {
            FindingType = "T",
            Category = "Security",
            EngineType = "e1",
            Title = "Same",
            Rationale = "r1",
            Severity = FindingSeverity.Warning
        };

        Mock<IFindingEngine> e1 = CreateEngine("e1", "Security", [a, b]);
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = new(
            [e1.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        snapshot.Findings.Should().ContainSingle(f => f.Title == "Same");
        snapshot.EngineFailures.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_SetsEmptyCategoryFromEngine()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding f = new()
        {
            FindingType = "T",
            Category = "",
            EngineType = "e1",
            Title = "t",
            Rationale = "r",
            Severity = FindingSeverity.Info
        };

        Mock<IFindingEngine> e1 = CreateEngine("e1", "Requirement", [f]);
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator sut = new(
            [e1.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        snapshot.Findings.Single().Category.Should().Be("Requirement");
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_InvalidPayload_DropsFindingAndRecordsEngineFailure()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding invalid = new()
        {
            FindingId = "bad-payload",
            FindingType = FindingTypes.RequirementFinding,
            Category = "Requirement",
            EngineType = "e1",
            Title = "Missing payload",
            Rationale = "r",
            Severity = FindingSeverity.Info,
            PayloadType = nameof(RequirementFindingPayload),
            Payload = JsonSerializer.SerializeToElement(42),
        };

        Finding valid = new()
        {
            FindingId = "good-payload",
            FindingType = FindingTypes.RequirementFinding,
            Category = "Requirement",
            EngineType = "e1",
            Title = "CheckoutApiUnderSpecified",
            Rationale = "CheckoutApiUnderSpecified",
            Severity = FindingSeverity.Warning,
            PayloadType = nameof(RequirementFindingPayload),
            Payload = new RequirementFindingPayload
            {
                RequirementName = "CheckoutApiUnderSpecified",
                RequirementText = "Complete",
                IsMandatory = true,
            },
            Trace = new ExplainabilityTrace
            {
                Notes = ["evidence:doc:manifest.json#services"],
            },
        };

        Mock<IFindingEngine> e1 = CreateEngine("e1", "Requirement", [invalid, valid]);
        FindingsOrchestrator sut = new(
            [e1.Object],
            new FindingPayloadValidator(),
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        snapshot.Findings.Should().ContainSingle(f => f.FindingId == "good-payload");
        snapshot.EngineFailures.Should().ContainSingle(f => f.ErrorMessage.Contains("bad-payload", StringComparison.Ordinal));
        snapshot.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.PartiallyComplete);
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_RecordsOccurredUtcFromTimeProviderOnEngineFailure()
    {
        GraphSnapshot graph = EmptyGraph();
        DateTimeOffset fixedUtc = new(2026, 4, 24, 18, 30, 0, TimeSpan.Zero);
        FakeTimeProviderForOrchestrator clock = new(fixedUtc);

        Mock<IFindingEngine> bad = new(MockBehavior.Strict);
        bad.Setup(x => x.EngineType).Returns("fail");
        bad.Setup(x => x.Category).Returns("Security");
        bad.Setup(x => x.AnalyzeAsync(graph, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        Mock<IFindingEngine> good = CreateEngine("ok", "Security", []);

        Mock<IFindingPayloadValidator> validator = new();
        FindingsOrchestrator sut = new(
            [bad.Object, good.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate,
            clock);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        snapshot.EngineFailures.Should().ContainSingle();
        snapshot.EngineFailures[0].OccurredUtc.Should().Be(fixedUtc.UtcDateTime);
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_runs_engines_in_parallel()
    {
        GraphSnapshot graph = EmptyGraph();
        int inFlight = 0;
        int maxInFlight = 0;
        object sync = new();

        async Task<IReadOnlyList<Finding>> DelayedAnalyze(GraphSnapshot _, CancellationToken ct)
        {
            lock (sync)
            {
                inFlight++;
                maxInFlight = Math.Max(maxInFlight, inFlight);
            }

            try
            {
                await Task.Delay(40, ct);
                return [];
            }
            finally
            {
                lock (sync)
                {
                    inFlight--;
                }
            }
        }

        Mock<IFindingEngine> e1 = new(MockBehavior.Strict);
        e1.Setup(x => x.EngineType).Returns("e1");
        e1.Setup(x => x.Category).Returns("Security");
        e1.Setup(x => x.AnalyzeAsync(graph, It.IsAny<CancellationToken>()))
            .Returns((GraphSnapshot g, CancellationToken ct) => DelayedAnalyze(g, ct));

        Mock<IFindingEngine> e2 = new(MockBehavior.Strict);
        e2.Setup(x => x.EngineType).Returns("e2");
        e2.Setup(x => x.Category).Returns("Topology");
        e2.Setup(x => x.AnalyzeAsync(graph, It.IsAny<CancellationToken>()))
            .Returns((GraphSnapshot g, CancellationToken ct) => DelayedAnalyze(g, ct));

        Mock<IFindingPayloadValidator> validator = new();
        FindingsOrchestrator sut = new(
            [e1.Object, e2.Object],
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate);

        await sut.GenerateFindingsSnapshotAsync(Guid.NewGuid(), Guid.NewGuid(), graph, CancellationToken.None);

        maxInFlight.Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_payload_conflict_is_confluent()
    {
        FindingsSnapshot first = await RunPayloadConflictAsync();
        FindingsSnapshot second = await RunPayloadConflictAsync();

        Finding surviving = first.Findings.Should().ContainSingle().Subject;
        surviving.FindingId.Should().Be("finding-alpha");
        surviving.FindingId.Should().Be(second.Findings.Single().FindingId);

        FindingEngineFailure firstConflict = first.EngineFailures.Should().ContainSingle().Subject;
        FindingEngineFailure secondConflict = second.EngineFailures.Should().ContainSingle().Subject;
        firstConflict.EngineType.Should().Be(FindingSnapshotConfluentMerger.ConflictEngineType);
        firstConflict.ErrorMessage.Should().Contain("alpha");
        firstConflict.ErrorMessage.Should().Contain("zulu");
        firstConflict.ErrorMessage.Should().Contain("finding-alpha");
        firstConflict.ErrorMessage.Should().Contain("finding-zulu");
        secondConflict.ErrorMessage.Should().Be(firstConflict.ErrorMessage);
        secondConflict.EngineType.Should().Be(firstConflict.EngineType);
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_disjoint_merge_keys_union()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding left = CreateFinding("finding-left", "zulu", "Left");
        Finding right = CreateFinding("finding-right", "alpha", "Right");

        Mock<IFindingEngine> laterOrdinal = CreateEngine("zulu", "Security", [left]);
        Mock<IFindingEngine> earlierOrdinal = CreateEngine("alpha", "Security", [right]);
        FindingsOrchestrator sut = CreateSut([laterOrdinal.Object, earlierOrdinal.Object]);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            graph,
            CancellationToken.None);

        snapshot.Findings.Select(static f => f.FindingId).Should().BeEquivalentTo(["finding-left", "finding-right"]);
        snapshot.EngineFailures.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_effectful_only_engines_still_return_snapshot()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding finding = CreateFinding("effectful-1", "effectful", "From effectful");
        Mock<IEffectfulFindingEngine> effectful = CreateEffectfulEngine("effectful", "Security", [finding]);
        FindingsOrchestrator sut = CreateSut([], [effectful.Object]);

        FindingsSnapshot snapshot = await sut.GenerateFindingsSnapshotAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            graph,
            CancellationToken.None);

        snapshot.Findings.Should().ContainSingle(f => f.FindingId == "effectful-1");
        snapshot.EngineFailures.Should().BeEmpty();
    }

    private static async Task<FindingsSnapshot> RunPayloadConflictAsync()
    {
        GraphSnapshot graph = EmptyGraph();
        Finding fromZulu = CreateFinding("finding-zulu", "zulu", "Same", FindingSeverity.Warning, "rationale-zulu");
        Finding fromAlpha = CreateFinding("finding-alpha", "alpha", "Same", FindingSeverity.Info, "rationale-alpha");

        Mock<IFindingEngine> zulu = CreateEngine("zulu", "Security", [fromZulu]);
        Mock<IFindingEngine> alpha = CreateEngine("alpha", "Security", [fromAlpha]);
        FindingsOrchestrator sut = CreateSut([zulu.Object, alpha.Object]);

        return await sut.GenerateFindingsSnapshotAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            graph,
            CancellationToken.None);
    }

    private static Finding CreateFinding(
        string findingId,
        string engineType,
        string title,
        FindingSeverity severity = FindingSeverity.Info,
        string rationale = "r")
    {
        return new Finding
        {
            FindingId = findingId,
            FindingType = "T",
            Category = "Security",
            EngineType = engineType,
            Title = title,
            Rationale = rationale,
            Severity = severity,
        };
    }

    private static FindingsOrchestrator CreateSut(
        IEnumerable<IFindingEngine> engines,
        IEnumerable<IEffectfulFindingEngine>? effectfulEngines = null)
    {
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        return new FindingsOrchestrator(
            engines,
            validator.Object,
            NullLogger<FindingsOrchestrator>.Instance,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate,
            TimeProvider.System,
            effectfulEngines);
    }

    private sealed class FakeTimeProviderForOrchestrator(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow()
        {
            return utcNow;
        }
    }

    private static Mock<IFindingEngine> CreateEngine(string engineType, string category, IReadOnlyList<Finding> findings)
    {
        Mock<IFindingEngine> mock = new(MockBehavior.Strict);
        mock.Setup(x => x.EngineType).Returns(engineType);
        mock.Setup(x => x.Category).Returns(category);
        mock.Setup(x => x.AnalyzeAsync(It.IsAny<GraphSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(findings);
        return mock;
    }

    private static Mock<IEffectfulFindingEngine> CreateEffectfulEngine(
        string engineType,
        string category,
        IReadOnlyList<Finding> findings)
    {
        Mock<IEffectfulFindingEngine> mock = new(MockBehavior.Strict);
        mock.Setup(x => x.EngineType).Returns(engineType);
        mock.Setup(x => x.Category).Returns(category);
        mock.Setup(x => x.AnalyzeAsync(It.IsAny<GraphSnapshot>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(findings);
        return mock;
    }
}
