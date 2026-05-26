using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Topology;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for <see cref="SetDiffConnectorDeltaComputer" /> covering all four delta outcomes
///     (added, removed, modified, unchanged) plus the initial-ingestion fast path.
/// </summary>
[Trait("Category", "Unit")]
public sealed class SetDiffConnectorDeltaComputerTests
{
    private readonly SetDiffConnectorDeltaComputer _sut = new();

    // ──────────────────────────────────────────────────────────────────
    // Initial ingestion (no previous objects)
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Compute_NoPrevious_ReportsAllCurrentAsAdded()
    {
        IReadOnlyList<CanonicalObject> current = MakePolicies("p1", "p2");

        ContextDelta delta = _sut.Compute(current, [], static o => o.SourceId);

        delta.AddedCount.Should().Be(2);
        delta.RemovedCount.Should().Be(0);
        delta.ModifiedCount.Should().Be(0);
        delta.UnchangedCount.Should().Be(0);
    }

    [Fact]
    public void Compute_NoPrevious_SummaryContainsInitialIngestion()
    {
        IReadOnlyList<CanonicalObject> current = MakePolicies("p1");

        ContextDelta delta = _sut.Compute(current, [], static o => o.SourceId);

        delta.Summary.Should().Contain("Initial ingestion");
        delta.Summary.Should().Contain("1");
    }

    [Fact]
    public void Compute_NoPreviousAndEmptyCurrent_ReportsZeroAndInitialSummary()
    {
        ContextDelta delta = _sut.Compute([], [], static o => o.SourceId);

        delta.AddedCount.Should().Be(0);
        delta.Summary.Should().Contain("Initial ingestion");
    }

    // ──────────────────────────────────────────────────────────────────
    // Added items
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Compute_NewKeyInCurrent_CountsAsAdded()
    {
        IReadOnlyList<CanonicalObject> previous = MakePolicies("existing");
        IReadOnlyList<CanonicalObject> current = MakePolicies("existing", "new-policy");

        ContextDelta delta = _sut.Compute(current, previous, static o => o.SourceId);

        delta.AddedCount.Should().Be(1);
        delta.RemovedCount.Should().Be(0);
    }

    // ──────────────────────────────────────────────────────────────────
    // Removed items
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Compute_KeyPresentInPreviousOnlyNotCurrent_CountsAsRemoved()
    {
        IReadOnlyList<CanonicalObject> previous = MakePolicies("p1", "p2");
        IReadOnlyList<CanonicalObject> current = MakePolicies("p1");

        ContextDelta delta = _sut.Compute(current, previous, static o => o.SourceId);

        delta.RemovedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
    }

    // ──────────────────────────────────────────────────────────────────
    // Unchanged items
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Compute_SameKeyAndProperties_CountsAsUnchanged()
    {
        CanonicalObject obj = MakePolicy("p1");
        IReadOnlyList<CanonicalObject> previous = [obj];
        // Clone with identical properties.
        IReadOnlyList<CanonicalObject> current = [MakePolicy("p1", obj.Properties)];

        ContextDelta delta = _sut.Compute(current, previous, static o => o.SourceId);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
    }

    // ──────────────────────────────────────────────────────────────────
    // Modified items
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Compute_SameKeyDifferentPropertyValue_CountsAsModified()
    {
        IReadOnlyList<CanonicalObject> previous =
        [
            MakePolicy("p1", new Dictionary<string, string> { ["status"] = "draft" })
        ];
        IReadOnlyList<CanonicalObject> current =
        [
            MakePolicy("p1", new Dictionary<string, string> { ["status"] = "approved" })
        ];

        ContextDelta delta = _sut.Compute(current, previous, static o => o.SourceId);

        delta.ModifiedCount.Should().Be(1);
        delta.UnchangedCount.Should().Be(0);
    }

    [Fact]
    public void Compute_SameKeyExtraPropertyInCurrent_CountsAsModified()
    {
        IReadOnlyList<CanonicalObject> previous =
        [
            MakePolicy("p1", new Dictionary<string, string> { ["a"] = "1" })
        ];
        IReadOnlyList<CanonicalObject> current =
        [
            MakePolicy("p1", new Dictionary<string, string> { ["a"] = "1", ["b"] = "2" })
        ];

        ContextDelta delta = _sut.Compute(current, previous, static o => o.SourceId);

        delta.ModifiedCount.Should().Be(1);
    }

    // ──────────────────────────────────────────────────────────────────
    // Mixed scenario
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Compute_MixedChanges_AllCountsAreCorrect()
    {
        IReadOnlyList<CanonicalObject> previous =
        [
            MakePolicy("kept-unchanged"),
            MakePolicy("modified-policy", new Dictionary<string, string> { ["v"] = "1" }),
            MakePolicy("removed-policy")
        ];
        IReadOnlyList<CanonicalObject> current =
        [
            MakePolicy("kept-unchanged"),
            MakePolicy("modified-policy", new Dictionary<string, string> { ["v"] = "2" }),
            MakePolicy("added-policy")
        ];

        ContextDelta delta = _sut.Compute(current, previous, static o => o.SourceId);

        delta.AddedCount.Should().Be(1, "added-policy is new");
        delta.RemovedCount.Should().Be(1, "removed-policy is gone");
        delta.ModifiedCount.Should().Be(1, "modified-policy value changed");
        delta.UnchangedCount.Should().Be(1, "kept-unchanged is identical");
    }

    [Fact]
    public void Compute_MixedChanges_SummaryCapturesAllCounts()
    {
        IReadOnlyList<CanonicalObject> previous =
        [
            MakePolicy("kept"),
            MakePolicy("changed", new Dictionary<string, string> { ["v"] = "old" }),
            MakePolicy("gone")
        ];
        IReadOnlyList<CanonicalObject> current =
        [
            MakePolicy("kept"),
            MakePolicy("changed", new Dictionary<string, string> { ["v"] = "new" }),
            MakePolicy("fresh")
        ];

        ContextDelta delta = _sut.Compute(current, previous, static o => o.SourceId);

        delta.Summary.Should().Contain("+1 added");
        delta.Summary.Should().Contain("-1 removed");
        delta.Summary.Should().Contain("1 modified");
        delta.Summary.Should().Contain("1 unchanged");
    }

    // ──────────────────────────────────────────────────────────────────
    // Determinism: same input → same output
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Compute_CalledTwiceWithSameInput_ReturnsSameDelta()
    {
        IReadOnlyList<CanonicalObject> previous = MakePolicies("a", "b");
        IReadOnlyList<CanonicalObject> current = MakePolicies("b", "c");

        ContextDelta first = _sut.Compute(current, previous, static o => o.SourceId);
        ContextDelta second = _sut.Compute(current, previous, static o => o.SourceId);

        second.AddedCount.Should().Be(first.AddedCount);
        second.RemovedCount.Should().Be(first.RemovedCount);
        second.ModifiedCount.Should().Be(first.ModifiedCount);
        second.UnchangedCount.Should().Be(first.UnchangedCount);
        second.Summary.Should().Be(first.Summary);
    }

    // ──────────────────────────────────────────────────────────────────
    // ObjectId as stable key (topology-hints connector pattern)
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public void Compute_UsingObjectIdKey_TopologyHintPatternIsStable()
    {
        string idA = TopologyHintStableObjectIds.FromHintName("hub-vnet");
        string idB = TopologyHintStableObjectIds.FromHintName("spoke-vnet");
        string idC = TopologyHintStableObjectIds.FromHintName("new-vnet");

        IReadOnlyList<CanonicalObject> previous = MakeTopologyHints(idA, idB);
        IReadOnlyList<CanonicalObject> current = MakeTopologyHints(idA, idC);

        ContextDelta delta = _sut.Compute(current, previous, static o => o.ObjectId);

        delta.AddedCount.Should().Be(1, "new-vnet added");
        delta.RemovedCount.Should().Be(1, "spoke-vnet removed");
        delta.UnchangedCount.Should().Be(1, "hub-vnet unchanged");
    }

    // ──────────────────────────────────────────────────────────────────
    // PolicyReferenceConnector integration: DeltaAsync uses SourceId key
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task PolicyReferenceConnector_DeltaAsync_NoPreviousSnapshot_ReturnsInitialDelta()
    {
        PolicyReferenceConnector connector = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            _sut);

        NormalizedContextBatch batch = await connector.NormalizeAsync(
            new RawContextPayload { PolicyReferences = ["SOC2", "ISO27001"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(batch, previous: null, CancellationToken.None);

        delta.AddedCount.Should().Be(2);
        delta.Summary.Should().Contain("Initial ingestion");
    }

    [Fact]
    public async Task PolicyReferenceConnector_DeltaAsync_AddedPolicy_CountsInDelta()
    {
        PolicyReferenceConnector connector = new(
            new PolicyReferencePayloadExtractor(),
            new PolicyReferencePayloadNormalizer(new PolicyTopologyOverlapResolver()),
            _sut);

        // Build the previous batch through the normalizer so Properties match exactly.
        NormalizedContextBatch previousBatch = await connector.NormalizeAsync(
            new RawContextPayload { PolicyReferences = ["SOC2"] },
            CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = previousBatch.CanonicalObjects
        };

        NormalizedContextBatch batch = await connector.NormalizeAsync(
            new RawContextPayload { PolicyReferences = ["SOC2", "ISO27001"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(batch, previous, CancellationToken.None);

        delta.AddedCount.Should().Be(1, "ISO27001 is new");
        delta.UnchangedCount.Should().Be(1, "SOC2 unchanged");
        delta.RemovedCount.Should().Be(0);
    }

    // ──────────────────────────────────────────────────────────────────
    // TopologyHintsConnector integration: DeltaAsync uses ObjectId key
    // ──────────────────────────────────────────────────────────────────

    [Fact]
    public async Task TopologyHintsConnector_DeltaAsync_NoPreviousSnapshot_ReturnsInitialDelta()
    {
        TopologyHintsConnector connector = new(
            new TopologyHintsPayloadExtractor(),
            new TopologyHintsPayloadNormalizer(),
            _sut);

        NormalizedContextBatch batch = await connector.NormalizeAsync(
            new RawContextPayload { TopologyHints = ["hub-vnet", "spoke-vnet"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(batch, previous: null, CancellationToken.None);

        delta.AddedCount.Should().Be(2);
        delta.Summary.Should().Contain("Initial ingestion");
    }

    [Fact]
    public async Task TopologyHintsConnector_DeltaAsync_RemovedHint_CountsInDelta()
    {
        TopologyHintsConnector connector = new(
            new TopologyHintsPayloadExtractor(),
            new TopologyHintsPayloadNormalizer(),
            _sut);

        // Build the previous batch through the normalizer so ObjectId and Properties match exactly.
        NormalizedContextBatch previousBatch = await connector.NormalizeAsync(
            new RawContextPayload { TopologyHints = ["hub-vnet", "spoke-vnet"] },
            CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = previousBatch.CanonicalObjects
        };

        // Current batch only has hub-vnet; spoke-vnet was removed.
        NormalizedContextBatch batch = await connector.NormalizeAsync(
            new RawContextPayload { TopologyHints = ["hub-vnet"] },
            CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(batch, previous, CancellationToken.None);

        delta.RemovedCount.Should().Be(1, "spoke-vnet removed");
        delta.UnchangedCount.Should().Be(1, "hub-vnet unchanged");
        delta.AddedCount.Should().Be(0);
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    private static IReadOnlyList<CanonicalObject> MakePolicies(params string[] sourceIds)
        => sourceIds.Select(id => MakePolicy(id)).ToList();

    private static CanonicalObject MakePolicy(
        string sourceId,
        Dictionary<string, string>? properties = null,
        string sourceType = "PolicyReference")
        => new()
        {
            ObjectType = "PolicyControl",
            Name = sourceId,
            SourceType = sourceType,
            SourceId = sourceId,
            Properties = properties ?? new Dictionary<string, string> { ["reference"] = sourceId }
        };

    private static IReadOnlyList<CanonicalObject> MakeTopologyHints(params string[] objectIds)
        => objectIds.Select(MakeTopologyHint).ToList();

    private static CanonicalObject MakeTopologyHint(string objectId)
        => new()
        {
            ObjectId = objectId,
            ObjectType = "TopologyResource",
            Name = objectId,
            SourceType = "TopologyHint",
            SourceId = "topology-hint",
            Properties = new Dictionary<string, string> { ["text"] = objectId }
        };
}
