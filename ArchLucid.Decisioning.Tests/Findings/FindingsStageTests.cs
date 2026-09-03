using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsPolicyStampStageTests
{
    [Fact]
    public async Task ExecuteAsync_without_scope_provider_is_noop()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
        };

        FindingsPolicyStampStage stage = new();
        await stage.ExecuteAsync(context, CancellationToken.None);

        graph.Nodes.Should().BeEmpty();
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsEngineInvokeStageTests
{
    [Fact]
    public async Task ExecuteAsync_all_engines_fail_throws_aggregate_exception()
    {
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid() };
        Mock<IFindingEngine> engine = new(MockBehavior.Strict);
        engine.Setup(x => x.EngineType).Returns("bad");
        engine.Setup(x => x.Category).Returns("Security");
        engine.Setup(x => x.AnalyzeAsync(graph, null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        Mock<IFindingPayloadValidator> validator = new(MockBehavior.Strict);
        FindingsEngineInvokeStage stage = new(
            [engine.Object],
            validator.Object,
            NullLogger<FindingsEngineInvokeStage>.Instance);

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = graph,
        };

        await Assert.ThrowsAsync<AggregateException>(() => stage.ExecuteAsync(context, CancellationToken.None));
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsMergeAndGateStageTests
{
    [Fact]
    public async Task ExecuteAsync_builds_snapshot_with_deduped_findings()
    {
        Finding finding = new()
        {
            FindingId = "f1",
            FindingType = "T",
            Category = "Security",
            EngineType = "e1",
            Title = "title",
            Rationale = "r",
            Severity = FindingSeverity.Info,
        };

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
        };
        context.AllFindings.Add(finding);
        context.SuccessfulEngineInvocations = 1;
        context.SuccessfulEngineTypes.Add("e1");

        FindingsMergeAndGateStage stage = new(
            Options.Create(new HumanReviewFindingOptions()),
            DeterministicInsightDensityGate.CreateDefault());

        await stage.ExecuteAsync(context, CancellationToken.None);

        context.Snapshot.Should().NotBeNull();
        context.Snapshot!.Findings.Should().ContainSingle();
        context.DedupedFindingsCount.Should().Be(1);
    }

    [Fact]
    public async Task ExecuteAsync_adds_engine_failure_when_required_engine_type_did_not_succeed()
    {
        FindingAnalysisContext analysisContext = new()
        {
            RequiredEngineTypes = ["security-baseline", "declaration-security-baseline"],
        };

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
            AnalysisContext = analysisContext,
        };
        context.SuccessfulEngineTypes.Add("topology-structure");

        FindingsMergeAndGateStage stage = new(
            Options.Create(new HumanReviewFindingOptions()),
            DeterministicInsightDensityGate.CreateDefault());

        await stage.ExecuteAsync(context, CancellationToken.None);

        context.Snapshot.Should().NotBeNull();
        context.Snapshot!.EngineFailures.Should().HaveCount(2);
        context.Snapshot.EngineFailures.Should().OnlyContain(failure => failure.EngineType == "policy-pack-coverage");
        context.Snapshot.EngineFailures.Select(failure => failure.ErrorMessage)
            .Should()
            .Contain(message => message.Contains("security-baseline", StringComparison.Ordinal))
            .And.Contain(message => message.Contains("declaration-security-baseline", StringComparison.Ordinal));
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsSnapshotEmitStageTests
{
    [Fact]
    public async Task ExecuteAsync_sets_generation_status_complete_when_no_failures()
    {
        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
        };
        context.Snapshot = new FindingsSnapshot
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = context.RunId,
            ContextSnapshotId = context.ContextSnapshotId,
            GraphSnapshotId = context.GraphSnapshot.GraphSnapshotId,
            CreatedUtc = DateTime.UtcNow,
            Findings = [],
            EngineFailures = [],
            SchemaVersion = 1,
        };

        FindingsSnapshotEmitStage stage = new(NullLogger<FindingsSnapshotEmitStage>.Instance);
        FindingsSnapshot result = await stage.ExecuteAsync(context, CancellationToken.None);

        result.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.Complete);
    }
}
