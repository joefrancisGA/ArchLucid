using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Repositories;
using ArchLucid.ContextIngestion.Services;
using ArchLucid.ContextIngestion.Summaries;
using ArchLucid.ContextIngestion.Topology;
using ArchLucid.Contracts.Persistence.Context;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Context Ingestion Service.
/// </summary>
[Trait("Suite", "Core")]
public sealed class ContextIngestionServiceTests
{
    [Fact]
    public async Task IngestAsync_ProducesEnrichedDeltaSummary()
    {
        InMemoryContextSnapshotRepository repo = new();
        CountingConnector countingConnector = new();

        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor> { new ConnectorDescriptor(1, countingConnector) },
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher(
            [
                new TopologyResourceCanonicalEnricher(),
                new SecurityBaselineCanonicalEnricher(),
            ]),
            new CanonicalDeduplicator(),
            repo);

        ContextIngestionRequest request = new() { RunId = Guid.NewGuid(), ProjectId = "proj-ingest-test" };

        ContextSnapshot snapshot = await sut.IngestAsync(request, CancellationToken.None);

        snapshot.CanonicalObjects.Should().HaveCount(1);
        snapshot.DeltaSummary.Should().Contain("connector summary");
        snapshot.DeltaSummary.Should().Contain("test-connector");
        snapshot.DeltaSummary.Should().Contain("1 produced");
        snapshot.DeltaSummary.Should().Contain("Requirement×1");
    }

    [Fact]
    public async Task IngestAsync_WhenPreviousSnapshotHadRequirements_StoresPriorRequirementNames()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "proj-prior-req",
            CreatedUtc = DateTime.UtcNow,
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectType = "Requirement",
                    Name = "availability",
                    SourceType = "Test",
                    SourceId = "prior-1"
                },
                new CanonicalObject
                {
                    ObjectType = "Requirement",
                    Name = "encryption",
                    SourceType = "Test",
                    SourceId = "prior-2"
                }
            ]
        };

        await repo.SaveAsync(previous, CancellationToken.None);

        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        ContextIngestionRequest request = new() { RunId = Guid.NewGuid(), ProjectId = "proj-prior-req" };

        ContextSnapshot snapshot = await sut.IngestAsync(request, CancellationToken.None);

        snapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.PriorRequirementNames);
        snapshot.SourceHashes[ContextScopeMetadataKeys.PriorRequirementNames].Should().Be("availability|encryption");
    }

    [Fact]
    public async Task IngestAsync_WhenPreviousSnapshotHadLongInlineRequirements_StoresAllPriorRequirementNames()
    {
        InMemoryContextSnapshotRepository repo = new();
        string sharedPrefix = new('r', 80);
        string firstRequirement = sharedPrefix + "alpha-tail";
        string secondRequirement = sharedPrefix + "beta-tail";

        IReadOnlyList<IConnectorDescriptor> descriptors =
        [
            new ConnectorDescriptor(
                1,
                new InlineRequirementsConnector(
                    new InlineRequirementsPayloadExtractor(),
                    new InlineRequirementsPayloadNormalizer(),
                    new SetDiffConnectorDeltaComputer()))
        ];

        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(descriptors, new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-long-inline-req";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            InlineRequirements = [firstRequirement, secondRequirement]
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);
        await repo.SaveAsync(firstSnapshot, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId
        };

        ContextSnapshot snapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        snapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.PriorRequirementNames);
        string[] priorNames = snapshot.SourceHashes[ContextScopeMetadataKeys.PriorRequirementNames]
            .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        priorNames.Should().HaveCount(2);
        priorNames.Should().OnlyContain(name => name.StartsWith(sharedPrefix, StringComparison.Ordinal));
        priorNames.Should().OnlyContain(name => name.Contains('#', StringComparison.Ordinal));
    }

    [Fact]
    public async Task IngestAsync_IdenticalTopologyHintOnSecondIngest_ReportsUnchangedDelta()
    {
        InMemoryContextSnapshotRepository repo = new();
        IReadOnlyList<IConnectorDescriptor> descriptors =
        [
            new ConnectorDescriptor(
                1,
                new TopologyHintsConnector(
                    new TopologyHintsPayloadExtractor(),
                    new TopologyHintsPayloadNormalizer(new PolicyTopologyOverlapResolver()),
                    new SetDiffConnectorDeltaComputer()))
        ];

        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(descriptors, new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([new TopologyResourceCanonicalEnricher()]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-topology-delta";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            TopologyHints = ["hub-vnet"]
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);
        await repo.SaveAsync(firstSnapshot, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            TopologyHints = ["hub-vnet"]
        };

        ContextSnapshot snapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        snapshot.DeltaSummary.Should().Contain("0 modified");
        snapshot.DeltaSummary.Should().Contain("1 unchanged");
    }

    [Fact]
    public async Task IngestAsync_TopologyHintPaddingAndCasing_ProducesStableScopeMetadata()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-scope-metadata";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            TopologyHints = ["hub-vnet"]
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            TopologyHints = [" Hub-Vnet "]
        };

        ContextSnapshot secondSnapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        secondSnapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.TopologyHints);
        secondSnapshot.SourceHashes[ContextScopeMetadataKeys.TopologyHints]
            .Should().Be(firstSnapshot.SourceHashes[ContextScopeMetadataKeys.TopologyHints]);
    }

    [Fact]
    public async Task IngestAsync_ConstraintPaddingAndCasing_ProducesStableScopeMetadata()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-constraint-metadata";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            Constraints = ["monthly budget cap $100"]
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            Constraints = [" Monthly Budget Cap $100 "]
        };

        ContextSnapshot secondSnapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        secondSnapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.Constraints);
        secondSnapshot.SourceHashes[ContextScopeMetadataKeys.Constraints]
            .Should().Be(firstSnapshot.SourceHashes[ContextScopeMetadataKeys.Constraints]);
    }

    [Fact]
    public async Task IngestAsync_RequiredCapabilityPaddingAndCasing_ProducesStableScopeMetadata()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-capability-metadata";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            RequiredCapabilities = ["cost-analysis"]
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            RequiredCapabilities = [" Cost-Analysis "]
        };

        ContextSnapshot secondSnapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        secondSnapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.RequiredCapabilities);
        secondSnapshot.SourceHashes[ContextScopeMetadataKeys.RequiredCapabilities]
            .Should().Be(firstSnapshot.SourceHashes[ContextScopeMetadataKeys.RequiredCapabilities]);
    }

    [Fact]
    public async Task IngestAsync_AssumptionPaddingAndCasing_ProducesStableScopeMetadata()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-assumption-metadata";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            Assumptions = ["existing sql database reused"]
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            Assumptions = [" Existing SQL Database Reused "]
        };

        ContextSnapshot secondSnapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        secondSnapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.Assumptions);
        secondSnapshot.SourceHashes[ContextScopeMetadataKeys.Assumptions]
            .Should().Be(firstSnapshot.SourceHashes[ContextScopeMetadataKeys.Assumptions]);
    }

    [Fact]
    public async Task IngestAsync_QualityAttributePaddingAndCasing_ProducesStableScopeMetadata()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-quality-metadata";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            QualityAttribute = "high availability"
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            QualityAttribute = " High Availability "
        };

        ContextSnapshot secondSnapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        secondSnapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.QualityAttribute);
        secondSnapshot.SourceHashes[ContextScopeMetadataKeys.QualityAttribute]
            .Should().Be(firstSnapshot.SourceHashes[ContextScopeMetadataKeys.QualityAttribute]);
    }

    [Fact]
    public async Task IngestAsync_FailureModeNotePaddingAndCasing_ProducesStableScopeMetadata()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-failure-mode-metadata";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            FailureModeNote = "region outage"
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            FailureModeNote = " Region Outage "
        };

        ContextSnapshot secondSnapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        secondSnapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.FailureModeNote);
        secondSnapshot.SourceHashes[ContextScopeMetadataKeys.FailureModeNote]
            .Should().Be(firstSnapshot.SourceHashes[ContextScopeMetadataKeys.FailureModeNote]);
    }

    [Fact]
    public async Task IngestAsync_ActorsJsonPropertyCasing_ProducesStableScopeMetadata()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string actorsCamelCase = """
                                       [
                                         {
                                           "label": "ops engineer",
                                           "kind": "Human",
                                           "trustOrigin": "Internal",
                                           "contract": "Sync",
                                           "origin": "Asserted",
                                           "confidence": 100
                                         }
                                       ]
                                       """;

        const string actorsPascalCaseKeys = """
                                            [
                                              {
                                                "Label": "ops engineer",
                                                "Kind": "Human",
                                                "TrustOrigin": "Internal",
                                                "Contract": "Sync",
                                                "Origin": "Asserted",
                                                "Confidence": 100
                                              }
                                            ]
                                            """;

        const string projectId = "proj-actors-metadata";
        ContextIngestionRequest firstRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            ActorsJson = actorsCamelCase
        };

        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);

        ContextIngestionRequest secondRequest = new()
        {
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            ActorsJson = actorsPascalCaseKeys
        };

        ContextSnapshot secondSnapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        secondSnapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.Actors);
        secondSnapshot.SourceHashes[ContextScopeMetadataKeys.Actors]
            .Should().Be(firstSnapshot.SourceHashes[ContextScopeMetadataKeys.Actors]);
    }

    [Fact]
    public async Task IngestAsync_PriorTopologyCategoryCasing_ProducesStableScopeMetadata()
    {
        InMemoryContextSnapshotRepository repo = new();
        ContextIngestionService sut = new(
            new DefaultConnectorPipelineOrchestrator(
                new List<IConnectorDescriptor>(),
                new DefaultContextDeltaSummaryBuilder()),
            new CompositeCanonicalEnricher([]),
            new CanonicalDeduplicator(),
            repo);

        const string projectId = "proj-prior-topology-categories";
        ContextSnapshot previousTitleCase = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            CreatedUtc = DateTime.UtcNow,
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectType = "TopologyResource",
                    Name = "hub-vnet",
                    SourceType = "Test",
                    SourceId = "prior-1",
                    Properties = new Dictionary<string, string> { ["category"] = "Network" }
                },
                new CanonicalObject
                {
                    ObjectType = "TopologyResource",
                    Name = "data-store",
                    SourceType = "Test",
                    SourceId = "prior-2",
                    Properties = new Dictionary<string, string> { ["category"] = "Storage" }
                }
            ]
        };

        await repo.SaveAsync(previousTitleCase, CancellationToken.None);

        ContextIngestionRequest firstRequest = new() { RunId = Guid.NewGuid(), ProjectId = projectId };
        ContextSnapshot firstSnapshot = await sut.IngestAsync(firstRequest, CancellationToken.None);

        ContextSnapshot previousLowerCase = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = projectId,
            CreatedUtc = DateTime.UtcNow,
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectType = "TopologyResource",
                    Name = "hub-vnet",
                    SourceType = "Test",
                    SourceId = "prior-1",
                    Properties = new Dictionary<string, string> { ["category"] = "network" }
                },
                new CanonicalObject
                {
                    ObjectType = "TopologyResource",
                    Name = "data-store",
                    SourceType = "Test",
                    SourceId = "prior-2",
                    Properties = new Dictionary<string, string> { ["category"] = "storage" }
                }
            ]
        };

        await repo.SaveAsync(previousLowerCase, CancellationToken.None);

        ContextIngestionRequest secondRequest = new() { RunId = Guid.NewGuid(), ProjectId = projectId };
        ContextSnapshot secondSnapshot = await sut.IngestAsync(secondRequest, CancellationToken.None);

        secondSnapshot.SourceHashes.Should().ContainKey(ContextScopeMetadataKeys.PriorTopologyCategories);
        secondSnapshot.SourceHashes[ContextScopeMetadataKeys.PriorTopologyCategories]
            .Should().Be(firstSnapshot.SourceHashes[ContextScopeMetadataKeys.PriorTopologyCategories]);
    }

    private sealed class CountingConnector : IContextConnector
    {
        public string ConnectorType => "test-connector";

        public Task<RawContextPayload> FetchAsync(ContextIngestionRequest request, CancellationToken ct)
        {
            _ = request;
            _ = ct;
            return Task.FromResult(new RawContextPayload());
        }

        public Task<NormalizedContextBatch> NormalizeAsync(RawContextPayload payload, CancellationToken ct)
        {
            _ = payload;
            _ = ct;
            NormalizedContextBatch batch = new();
            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectType = "Requirement",
                Name = "from-test",
                SourceType = "Test",
                SourceId = "t",
                Properties = new Dictionary<string, string> { ["text"] = "hello" }
            });
            return Task.FromResult(batch);
        }

        public Task<ContextDelta> DeltaAsync(
            NormalizedContextBatch current,
            ContextSnapshot? previous,
            CancellationToken ct)
        {
            _ = current;
            _ = previous;
            _ = ct;
            return Task.FromResult(new ContextDelta { Summary = "connector summary" });
        }
    }
}
