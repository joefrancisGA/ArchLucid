using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Infrastructure Declaration Connector.
/// </summary>
[Trait("Category", "Unit")]
public sealed class InfrastructureDeclarationConnectorTests
{
    [Fact]
    public async Task NormalizeAsync_Warns_WhenFormatUnsupported()
    {
        InfrastructureDeclarationConnector sut = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([]),
            new Moq.Mock<ArchLucid.ContextIngestion.Delta.IConnectorDeltaComputer>().Object);
        RawContextPayload payload = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    Name = "bad.fmt", Format = "hcl", Content = "resource \"x\" \"y\" {}"
                }
            ]
        };

        NormalizedContextBatch batch = await sut.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().BeEmpty();
        batch.Warnings.Should().ContainSingle().Which.Should().Contain("bad.fmt").And.Contain("hcl");
    }

    [Fact]
    public async Task NormalizeAsync_DelegatesToParser()
    {
        Mock<IInfrastructureDeclarationParser> parser = new();
        parser.Setup(p => p.CanParse("json")).Returns(true);
        parser.Setup(p => p.ParseAsync(It.IsAny<InfrastructureDeclarationReference>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CanonicalObject>
            {
                new()
                {
                    ObjectType = "TopologyResource",
                    Name = "a",
                    SourceType = "InfrastructureDeclaration",
                    SourceId = "d",
                    Properties = new Dictionary<string, string> { ["resourceType"] = "vnet" }
                }
            });

        InfrastructureDeclarationConnector sut = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser.Object]),
            new Moq.Mock<ArchLucid.ContextIngestion.Delta.IConnectorDeltaComputer>().Object);
        RawContextPayload payload = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference { Name = "x", Format = "json", Content = "{}" }
            ]
        };

        NormalizedContextBatch batch = await sut.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().HaveCount(1);
        parser.Verify(p => p.ParseAsync(It.IsAny<InfrastructureDeclarationReference>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DeltaAsync_MultipleResourcesInSameDeclaration_CountsEachResource()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([]),
            new SetDiffConnectorDeltaComputer());

        NormalizedContextBatch previousBatch = new();
        previousBatch.CanonicalObjects.Add(MakeInfraResource("decl-1", "hub-vnet", "vnet"));
        previousBatch.CanonicalObjects.Add(MakeInfraResource("decl-1", "hub-subnet", "subnet"));

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = previousBatch.CanonicalObjects,
        };

        NormalizedContextBatch currentBatch = new();
        currentBatch.CanonicalObjects.Add(MakeInfraResource("decl-1", "hub-vnet", "vnet"));
        currentBatch.CanonicalObjects.Add(MakeInfraResource("decl-1", "hub-subnet", "subnet"));
        currentBatch.CanonicalObjects.Add(MakeInfraResource("decl-1", "storage-acct", "storage"));

        ContextDelta delta = await connector.DeltaAsync(currentBatch, previous, CancellationToken.None);

        delta.AddedCount.Should().Be(1, "storage-acct is new within the same declaration");
        delta.UnchangedCount.Should().Be(2, "hub-vnet and hub-subnet are unchanged");
        delta.RemovedCount.Should().Be(0);
    }

    private static CanonicalObject MakeInfraResource(string declarationId, string name, string resourceType)
        => new()
        {
            ObjectType = "TopologyResource",
            Name = name,
            SourceType = "InfrastructureDeclaration",
            SourceId = declarationId,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["resourceType"] = resourceType,
            },
        };
}
