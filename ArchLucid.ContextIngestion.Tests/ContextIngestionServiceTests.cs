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
