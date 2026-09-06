using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Mapping;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     Focused pipeline-stage tests for TB-2370. Each test targets one stage's skip/materialize behavior without mocking
///     <see cref="Builders.DefaultGraphBuilder" />.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GraphMaterializationStageTests
{
    [Fact]
    public void DefaultStageOrder_matches_registrar_pipeline()
    {
        GraphMaterializationPipeline pipeline = GraphMaterializationStages.CreateDefaultPipeline(new Mock<IGraphNodeFactory>().Object);

        pipeline.Stages.Select(stage => stage.Name).Should().Equal(GraphMaterializationStages.DefaultStageOrder);
    }

    [Fact]
    public async Task CanonicalObjectsStage_materializes_canonical_objects_and_sets_presence_flags()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.CanonicalObjects =
        [
            CreateCanonical(GraphNodeTypes.Actor, "actor-1"),
            CreateCanonical(GraphNodeTypes.Assumption, "assumption-1"),
        ];

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "canonical-objects");

        result.StageOutcomes.Should().ContainSingle();
        result.StageOutcomes[0].Should().Match<GraphMaterializationStageOutcome>(o =>
            o.StageName == "canonical-objects"
            && o.Skipped == false
            && o.NodesAdded == 2);

        GraphMaterializationContext context = CreateContext(snapshot);
        await RunThroughStage(context, "canonical-objects");

        context.HasCanonicalActors.Should().BeTrue();
        context.HasCanonicalAssumptions.Should().BeTrue();
        context.HasCanonicalCostConstraints.Should().BeFalse();
    }

    [Fact]
    public async Task CanonicalObjectsStage_marks_skipped_when_no_canonical_objects()
    {
        GraphMaterializationRunResult result = await RunThroughStage(CreateSnapshot(), "canonical-objects");

        result.StageOutcomes.Should().ContainSingle();
        result.StageOutcomes[0].Skipped.Should().BeTrue();
        result.StageOutcomes[0].NodesAdded.Should().Be(0);
    }

    [Fact]
    public async Task RequestCostConstraintsStage_materializes_from_metadata_when_canonical_missing()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.SourceHashes[ContextScopeMetadataKeys.Constraints] = "Monthly budget $5000";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-cost-constraints");

        GraphMaterializationStageOutcome stage = result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-cost-constraints").Subject;
        stage.Skipped.Should().BeFalse();
        stage.NodesAdded.Should().Be(1);
    }

    [Fact]
    public async Task RequestCostConstraintsStage_skips_when_canonical_cost_constraints_exist()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.CanonicalObjects = [CreateCanonical(GraphNodeTypes.CostConstraint, "cost-1")];
        snapshot.SourceHashes[ContextScopeMetadataKeys.Constraints] = "Monthly budget $5000";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-cost-constraints");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-cost-constraints")
            .Which.Should().Match<GraphMaterializationStageOutcome>(o => o.Skipped && o.NodesAdded == 0);
    }

    [Fact]
    public async Task RequestActorsStage_materializes_from_metadata_when_canonical_missing()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.SourceHashes[ContextScopeMetadataKeys.Actors] =
            """
            [{"label":"Ops engineer","kind":"Human","trustOrigin":"Internal","contract":"Sync","origin":"Asserted","confidence":100}]
            """;

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-actors");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-actors")
            .Which.Should().Match<GraphMaterializationStageOutcome>(o => o.Skipped == false && o.NodesAdded == 1);
    }

    [Fact]
    public async Task DeclarationIdentityActorsStage_materializes_from_k8s_service_account_when_intake_missing()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.CanonicalObjects =
        [
            new CanonicalObject
            {
                ObjectId = "sa-1",
                ObjectType = GraphNodeTypes.SecurityBaseline,
                Name = "payments/worker",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-1",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["k8s.kind"] = "serviceaccount",
                    ["k8s.name"] = "worker",
                    ["k8s.namespace"] = "payments",
                },
            },
        ];

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "declaration-identity-actors");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "declaration-identity-actors")
            .Which.Should().Match<GraphMaterializationStageOutcome>(o => o.Skipped == false && o.NodesAdded == 1);
    }

    [Fact]
    public async Task DeclarationIdentityActorsStage_materializes_declaration_actors_when_request_actors_exist_without_duplicates()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.CanonicalObjects =
        [
            new CanonicalObject
            {
                ObjectId = "ingress-1",
                ObjectType = GraphNodeTypes.SecurityBaseline,
                Name = "payments/public",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-ingress",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["k8s.kind"] = "ingress",
                    ["k8s.name"] = "public",
                    ["k8s.namespace"] = "payments",
                },
            },
        ];
        snapshot.SourceHashes[ContextScopeMetadataKeys.Actors] =
            """
            [{"label":"Ops engineer","kind":"Human","trustOrigin":"Internal","contract":"Sync","origin":"Asserted","confidence":100}]
            """;

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "declaration-identity-actors");

        result.StageOutcomes.Should().Contain(o => o.StageName == "declaration-identity-actors"
            && o.Skipped == false
            && o.NodesAdded >= 2);
    }

    [Fact]
    public async Task RequestActorsStage_skips_when_canonical_actors_exist()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.CanonicalObjects = [CreateCanonical(GraphNodeTypes.Actor, "actor-1")];
        snapshot.SourceHashes[ContextScopeMetadataKeys.Actors] = "[]";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-actors");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-actors")
            .Which.Skipped.Should().BeTrue();
    }

    [Fact]
    public async Task RequestAssumptionsStage_materializes_from_metadata_when_canonical_missing()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.SourceHashes[ContextScopeMetadataKeys.Assumptions] = "Single-region MVP|Entra ID for staff";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-assumptions");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-assumptions")
            .Which.Should().Match<GraphMaterializationStageOutcome>(o => o.Skipped == false && o.NodesAdded == 2);
    }

    [Fact]
    public async Task RequestAssumptionsStage_skips_when_canonical_assumptions_exist()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.CanonicalObjects = [CreateCanonical(GraphNodeTypes.Assumption, "assumption-1")];
        snapshot.SourceHashes[ContextScopeMetadataKeys.Assumptions] = "ignored";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-assumptions");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-assumptions")
            .Which.Skipped.Should().BeTrue();
    }

    [Fact]
    public async Task RequestQualityAttributesStage_materializes_from_metadata_when_canonical_missing()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.SourceHashes[ContextScopeMetadataKeys.QualityAttribute] = "RTO 4 hours for payment API";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-quality-attributes");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-quality-attributes")
            .Which.Should().Match<GraphMaterializationStageOutcome>(o => o.Skipped == false && o.NodesAdded == 1);
    }

    [Fact]
    public async Task RequestQualityAttributesStage_skips_when_canonical_quality_attributes_exist()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.CanonicalObjects = [CreateCanonical(GraphNodeTypes.QualityAttribute, "qa-1")];
        snapshot.SourceHashes[ContextScopeMetadataKeys.QualityAttribute] = "ignored";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-quality-attributes");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-quality-attributes")
            .Which.Skipped.Should().BeTrue();
    }

    [Fact]
    public async Task RequestFailureModesStage_materializes_from_metadata_when_canonical_missing()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.SourceHashes[ContextScopeMetadataKeys.FailureModeNote] = "Region loss blocks checkout";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-failure-modes");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-failure-modes")
            .Which.Should().Match<GraphMaterializationStageOutcome>(o => o.Skipped == false && o.NodesAdded == 1);
    }

    [Fact]
    public async Task RequestFailureModesStage_skips_when_canonical_failure_modes_exist()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.CanonicalObjects = [CreateCanonical(GraphNodeTypes.FailureMode, "fm-1")];
        snapshot.SourceHashes[ContextScopeMetadataKeys.FailureModeNote] = "ignored";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-failure-modes");

        result.StageOutcomes.Should().ContainSingle(o => o.StageName == "request-failure-modes")
            .Which.Skipped.Should().BeTrue();
    }

    [Fact]
    public async Task CostProjectedSpendEnrichmentStage_enriches_cost_constraints_from_topology()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.SourceHashes[ContextScopeMetadataKeys.Constraints] = "Monthly budget cap $100";
        snapshot.CanonicalObjects =
        [
            new CanonicalObject
            {
                ObjectId = "cmp-1",
                ObjectType = GraphNodeTypes.TopologyResource,
                Name = "api",
                SourceType = "test",
                SourceId = "cmp-1",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["category"] = GraphTopologyCategories.Compute,
                },
            },
        ];

        GraphMaterializationContext context = CreateContext(snapshot);
        GraphMaterializationPipeline pipeline = GraphMaterializationStages.CreateDefaultPipeline(new GraphNodeFactory());
        GraphMaterializationPipelineOptions options = new()
        {
            StopAfterStageName = "cost-projected-spend-enrichment",
        };

        await pipeline.RunAsync(context, CancellationToken.None, options);

        GraphNode costNode = context.Nodes.Should().Contain(n => n.NodeType == GraphNodeTypes.CostConstraint).Subject;
        costNode.Properties.Should().ContainKey("projectedMonthlySpendUsd");
    }

    [Fact]
    public async Task StopAfterStageName_runs_only_stages_up_to_named_stage()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.SourceHashes[ContextScopeMetadataKeys.Actors] = "[]";

        GraphMaterializationRunResult result = await RunThroughStage(snapshot, "request-actors");

        result.StageOutcomes.Select(o => o.StageName).Should().Equal([
            "canonical-objects",
            "request-cost-constraints",
            "request-actors",
        ]);
    }

    [Fact]
    public async Task FailFastOnStageException_wraps_stage_failure_with_stage_name()
    {
        Mock<IGraphMaterializationStage> failingStage = new();
        failingStage.SetupGet(s => s.Name).Returns("failing-stage");
        failingStage
            .Setup(s => s.ApplyAsync(It.IsAny<GraphMaterializationContext>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        GraphMaterializationPipeline pipeline = new([failingStage.Object]);
        GraphMaterializationContext context = CreateContext(CreateSnapshot());
        GraphMaterializationPipelineOptions options = new() { FailFastOnStageException = true };

        Func<Task> act = () => pipeline.RunAsync(context, CancellationToken.None, options);

        GraphMaterializationStageException exception = (await act.Should().ThrowAsync<GraphMaterializationStageException>()).Which;
        exception.StageName.Should().Be("failing-stage");
        exception.InnerException.Should().BeOfType<InvalidOperationException>();
    }

    [Fact]
    public async Task RunAsync_captures_per_stage_telemetry_for_full_pipeline()
    {
        ContextSnapshot snapshot = CreateSnapshot();
        snapshot.SourceHashes[ContextScopeMetadataKeys.Constraints] = "Monthly budget $5000";

        GraphMaterializationPipeline pipeline = GraphMaterializationStages.CreateDefaultPipeline(new GraphNodeFactory());
        GraphMaterializationContext context = CreateContext(snapshot);

        GraphMaterializationRunResult result = await pipeline.RunAsync(context, CancellationToken.None);

        result.StageOutcomes.Select(o => o.StageName).Should().Equal(GraphMaterializationStages.DefaultStageOrder);
        result.TotalElapsedMilliseconds.Should().BeGreaterThanOrEqualTo(0);
        result.StageOutcomes.Should().OnlyContain(o => o.ElapsedMilliseconds >= 0);
    }

    private static async Task<GraphMaterializationRunResult> RunThroughStage(
        ContextSnapshot snapshot,
        string stopAfterStageName)
    {
        GraphMaterializationContext context = CreateContext(snapshot);
        return await RunThroughStage(context, stopAfterStageName);
    }

    private static async Task<GraphMaterializationRunResult> RunThroughStage(
        GraphMaterializationContext context,
        string stopAfterStageName)
    {
        GraphMaterializationPipeline pipeline = GraphMaterializationStages.CreateDefaultPipeline(new GraphNodeFactory());
        GraphMaterializationPipelineOptions options = new()
        {
            StopAfterStageName = stopAfterStageName,
        };

        return await pipeline.RunAsync(context, CancellationToken.None, options);
    }

    private static GraphMaterializationContext CreateContext(ContextSnapshot snapshot)
    {
        List<GraphNode> nodes =
        [
            new GraphNode
            {
                NodeId = $"context-{snapshot.SnapshotId:N}",
                NodeType = GraphNodeTypes.ContextSnapshot,
                Label = $"Context Snapshot {snapshot.SnapshotId:N}",
                SourceType = GraphNodeTypes.ContextSnapshot,
                SourceId = snapshot.SnapshotId.ToString(),
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
            },
        ];

        return new GraphMaterializationContext(snapshot, nodes);
    }

    private static ContextSnapshot CreateSnapshot()
    {
        return new ContextSnapshot
        {
            SnapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            RunId = Guid.NewGuid(),
            ProjectId = "project-1",
        };
    }

    private static CanonicalObject CreateCanonical(string objectType, string objectId)
    {
        return new CanonicalObject
        {
            ObjectId = objectId,
            ObjectType = objectType,
            Name = objectId,
            SourceType = "test",
            SourceId = objectId,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
    }
}
