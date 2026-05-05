using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Locks Phase 1 split: typed extractors/normalizers align with <see cref="IContextConnector" /> facades.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ConnectorPayloadStageContractTests
{
    [Fact]
    public void StaticRequestPayloadExtractor_Extract_CopiesDescription()
    {
        ContextIngestionRequest request = new()
        {
            Description = "hello",
            ProjectId = "p",
            RunId = Guid.NewGuid()
        };

        StaticRequestPayloadExtractor extractor = new();

        StaticRequestPayload typed = extractor.Extract(request);

        typed.Description.Should().Be("hello");
    }

    [Fact]
    public async Task StaticRequestContextConnector_FetchNormalize_RoundTripsTypedStages()
    {
        ContextIngestionRequest request = new()
        {
            Description = "need HA",
            ProjectId = "p",
            RunId = Guid.NewGuid()
        };

        StaticRequestContextConnector facade = new(
            new StaticRequestPayloadExtractor(),
            new StaticRequestPayloadNormalizer());

        RawContextPayload raw = await facade.FetchAsync(request, CancellationToken.None);
        NormalizedContextBatch batch = await facade.NormalizeAsync(raw, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.CanonicalObjects[0].Properties["text"].Should().Be("need HA");
    }

    [Fact]
    public void InlineRequirementsPayloadExtractor_Extract_CopiesListSnapshot()
    {
        ContextIngestionRequest request = new()
        {
            InlineRequirements = ["a", "b"],
            ProjectId = "p",
            RunId = Guid.NewGuid()
        };

        InlineRequirementsPayload typed = new InlineRequirementsPayloadExtractor().Extract(request);

        typed.InlineRequirements.Should().Equal("a", "b");
    }

    [Fact]
    public void PolicyReferencePayloadExtractor_Extract_CopiesPolicyAndTopologySlices()
    {
        ContextIngestionRequest request = new()
        {
            PolicyReferences = ["p1"],
            TopologyHints = ["t1"],
            ProjectId = "p",
            RunId = Guid.NewGuid()
        };

        PolicyReferencePayload typed = new PolicyReferencePayloadExtractor().Extract(request);

        typed.PolicyReferences.Should().Equal("p1");
        typed.TopologyHints.Should().Equal("t1");
    }
}
