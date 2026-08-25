using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.KnowledgeGraph.Services;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     Tests for Graph Snapshot Canonical Fingerprint.
/// </summary>
[Trait("Category", "Unit")]
public sealed class GraphSnapshotCanonicalFingerprintTests
{
    [Fact]
    public void AreEquivalent_WhenPreviousNull_ReturnsFalse()
    {
        ContextSnapshot current = BuildSnapshot("p1",
        [
            new CanonicalObject
            {
                ObjectId = "a",
                ObjectType = "t",
                Name = "n",
                SourceType = "s",
                SourceId = "1"
            }
        ]);

        bool equivalent = GraphSnapshotCanonicalFingerprint.AreEquivalent(null, current);

        equivalent.Should().BeFalse();
    }

    [Fact]
    public void AreEquivalent_WhenSameSnapshotId_ReturnsFalse()
    {
        Guid id = Guid.NewGuid();
        ContextSnapshot a = BuildSnapshot("p1", [], id);
        ContextSnapshot b = BuildSnapshot("p1", [], id);

        bool equivalent = GraphSnapshotCanonicalFingerprint.AreEquivalent(a, b);

        equivalent.Should().BeFalse();
    }

    [Fact]
    public void AreEquivalent_WhenCanonicalSetsMatch_ReturnsTrue()
    {
        List<CanonicalObject> objects =
        [
            new()
            {
                ObjectId = "b",
                ObjectType = "type",
                Name = "B",
                SourceType = "src",
                SourceId = "2"
            },
            new()
            {
                ObjectId = "a",
                ObjectType = "type",
                Name = "A",
                SourceType = "src",
                SourceId = "1"
            }
        ];

        ContextSnapshot previous = BuildSnapshot("proj", objects, Guid.NewGuid());
        ContextSnapshot current = BuildSnapshot("proj", objects, Guid.NewGuid());

        bool equivalent = GraphSnapshotCanonicalFingerprint.AreEquivalent(previous, current);

        equivalent.Should().BeTrue();
    }

    [Fact]
    public void Compute_IsOrderInsensitiveForCanonicalObjects()
    {
        List<CanonicalObject> setA =
        [
            new()
            {
                ObjectId = "a",
                ObjectType = "t",
                Name = "n",
                SourceType = "s",
                SourceId = "1"
            },
            new()
            {
                ObjectId = "b",
                ObjectType = "t",
                Name = "n2",
                SourceType = "s",
                SourceId = "2"
            }
        ];
        List<CanonicalObject> setB =
        [
            new()
            {
                ObjectId = "b",
                ObjectType = "t",
                Name = "n2",
                SourceType = "s",
                SourceId = "2"
            },
            new()
            {
                ObjectId = "a",
                ObjectType = "t",
                Name = "n",
                SourceType = "s",
                SourceId = "1"
            }
        ];

        string fa = GraphSnapshotCanonicalFingerprint.Compute(BuildSnapshot("p", setA));
        string fb = GraphSnapshotCanonicalFingerprint.Compute(BuildSnapshot("p", setB));

        fa.Should().Be(fb);
    }

    [Fact]
    public void AreEquivalentForReuse_WhenContextMatchesButKnowledgeModelChanged_ReturnsFalse()
    {
        List<CanonicalObject> objects =
        [
            new()
            {
                ObjectId = "a",
                ObjectType = "type",
                Name = "A",
                SourceType = "src",
                SourceId = "1"
            }
        ];

        ContextSnapshot previous = BuildSnapshot("proj", objects, Guid.NewGuid());
        ContextSnapshot current = BuildSnapshot("proj", objects, Guid.NewGuid());

        ArchitectureKnowledgeModel priorModel = new()
        {
            ModelId = "model-1",
            UpdatedUtc = DateTime.UtcNow,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Orders",
                },
            ],
        };

        ArchitectureKnowledgeModel currentModel = new()
        {
            ModelId = "model-1",
            UpdatedUtc = priorModel.UpdatedUtc,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Orders v2",
                },
            ],
        };

        bool equivalent = GraphSnapshotCanonicalFingerprint.AreEquivalentForReuse(
            previous,
            current,
            priorModel,
            currentModel);

        equivalent.Should().BeFalse();
    }

    [Fact]
    public void AreEquivalentForReuse_WhenModelIdsDiffer_ReturnsFalse()
    {
        List<CanonicalObject> objects =
        [
            new()
            {
                ObjectId = "a",
                ObjectType = "type",
                Name = "A",
                SourceType = "src",
                SourceId = "1"
            }
        ];

        ContextSnapshot previous = BuildSnapshot("proj", objects, Guid.NewGuid());
        ContextSnapshot current = BuildSnapshot("proj", objects, Guid.NewGuid());
        DateTime updatedUtc = DateTime.UtcNow;

        ArchitectureKnowledgeModel priorModel = new()
        {
            ModelId = "model-prior",
            UpdatedUtc = updatedUtc,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Orders",
                },
            ],
        };

        ArchitectureKnowledgeModel currentModel = new()
        {
            ModelId = "model-current",
            UpdatedUtc = updatedUtc,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Orders",
                },
            ],
        };

        bool equivalent = GraphSnapshotCanonicalFingerprint.AreEquivalentForReuse(
            previous,
            current,
            priorModel,
            currentModel);

        equivalent.Should().BeFalse();
    }

    [Fact]
    public void ComputeKnowledgeModelFingerprint_includes_description_framing_answers_and_provisional_flag()
    {
        DateTime updatedUtc = new(2026, 8, 25, 12, 0, 0, DateTimeKind.Utc);

        ArchitectureKnowledgeModel baseline = CreateFingerprintModel(updatedUtc, "Orders API", false, "scale");
        ArchitectureKnowledgeModel descriptionChanged = CreateFingerprintModel(updatedUtc, "Orders API v2", false, "scale");
        ArchitectureKnowledgeModel framingChanged = CreateFingerprintModel(updatedUtc, "Orders API", false, "latency");
        ArchitectureKnowledgeModel provisionalChanged = CreateFingerprintModel(updatedUtc, "Orders API", true, "scale");

        string baselineFingerprint = GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(baseline);

        baselineFingerprint.Should().NotBe(GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(descriptionChanged));
        baselineFingerprint.Should().NotBe(GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(framingChanged));
        baselineFingerprint.Should().NotBe(GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(provisionalChanged));
        baselineFingerprint.Should().Contain("complete");
        GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(provisionalChanged).Should().Contain("provisional");
        baselineFingerprint.Should().Contain("goal=scale");
    }

    [Fact]
    public void ComputeKnowledgeModelFingerprint_includes_declared_priorities()
    {
        DateTime updatedUtc = new(2026, 8, 25, 12, 0, 0, DateTimeKind.Utc);

        ArchitectureKnowledgeModel securityFirst = CreateFingerprintModel(updatedUtc, "Orders API", false, "scale");
        securityFirst.DeclaredPriorities = ["Security", "Cost"];

        ArchitectureKnowledgeModel costFirst = CreateFingerprintModel(updatedUtc, "Orders API", false, "scale");
        costFirst.DeclaredPriorities = ["Cost", "Security"];

        GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(securityFirst)
            .Should().NotBe(GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(costFirst));
    }

    private static ArchitectureKnowledgeModel CreateFingerprintModel(
        DateTime updatedUtc,
        string description,
        bool isProvisionalSynthesis,
        string framingGoal)
    {
        return new ArchitectureKnowledgeModel
        {
            ModelId = "model-1",
            UpdatedUtc = updatedUtc,
            IsProvisionalSynthesis = isProvisionalSynthesis,
            FramingAnswers = new Dictionary<string, string> { ["goal"] = framingGoal },
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "svc-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "Orders",
                    Description = description,
                },
            ],
        };
    }

    private static ContextSnapshot BuildSnapshot(string projectId, List<CanonicalObject> objects,
        Guid? snapshotId = null)
    {
        return new ContextSnapshot
        {
            SnapshotId = snapshotId ?? Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CanonicalObjects = objects
        };
    }
}
