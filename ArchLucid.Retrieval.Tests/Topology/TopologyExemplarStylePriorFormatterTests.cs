using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Topology;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests.Topology;

[Trait("Suite", "Core")]
public sealed class TopologyExemplarStylePriorFormatterTests
{
    [Fact]
    public void FormatStylePriorBlock_WhenEmpty_SignalsExemplarMissing()
    {
        string block = TopologyExemplarStylePriorFormatter.FormatStylePriorBlock([]);

        block.Should().Contain("exemplarMissing: true");
    }

    [Fact]
    public void FormatStylePriorBlock_WhenHitsPresent_IncludesStyleGuideText()
    {
        RetrievalHit hit = new()
        {
            ChunkId = "chunk-1",
            DocumentId = "exemplar-standard-3-tier",
            CorpusKind = "ReferenceArchitecture",
            SourceType = "ReferenceArchitectureExemplar",
            SourceId = "standard-3-tier-web",
            Title = "Standard 3-tier web",
            Text = "App Service front-end with SQL backend.",
            Score = 0.92,
        };

        string block = TopologyExemplarStylePriorFormatter.FormatStylePriorBlock([hit]);

        block.Should().Contain("exemplarMissing: false");
        block.Should().Contain("App Service front-end with SQL backend.");
    }

    [Fact]
    public void BuildExemplarQueryText_IncludesCloudProviderAndConstraints()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "ContosoRetailWeb",
            Description = "Three-tier web application.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = ["Private endpoints for data tiers"],
        };

        string query = TopologyExemplarStylePriorFormatter.BuildExemplarQueryText(request);

        query.Should().Contain("Azure");
        query.Should().Contain("ContosoRetailWeb");
        query.Should().Contain("Private endpoints for data tiers");
    }
}
