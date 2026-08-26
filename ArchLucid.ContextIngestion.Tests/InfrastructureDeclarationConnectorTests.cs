using ArchLucid.ContextIngestion.Connectors;
using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Delta;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

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

    [Fact]
    public async Task DeltaAsync_ReMappedIdenticalArchitectureRequest_ReportsUnchangedResources()
    {
        ArchitectureRequest request = new()
        {
            Description = "1234567890 minimum len",
            SystemName = "billing-api",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationRequest
                {
                    Name = "env.json",
                    Format = "json",
                    Content = """
                              {
                                "resources": [
                                  { "type": "vnet", "name": "hub-vnet" },
                                  { "type": "subnet", "name": "hub-subnet" }
                                ]
                              }
                              """,
                }
            ]
        };

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new JsonInfrastructureDeclarationParser(Microsoft.Extensions.Logging.Abstractions.NullLogger<JsonInfrastructureDeclarationParser>.Instance)]),
            new SetDiffConnectorDeltaComputer());

        ContextIngestionRequest firstMapped = ContextIngestionRequestMapper.FromArchitectureRequest(request);
        RawContextPayload firstRaw = await connector.FetchAsync(firstMapped, CancellationToken.None);
        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = firstMapped.ProjectId,
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        ContextIngestionRequest secondMapped = ContextIngestionRequestMapper.FromArchitectureRequest(request);
        RawContextPayload secondRaw = await connector.FetchAsync(secondMapped, CancellationToken.None);
        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
        delta.UnchangedCount.Should().Be(2);
    }

    [Fact]
    public async Task JsonInfrastructureDeclarationParser_PaddedResourceName_IsTrimmed()
    {
        JsonInfrastructureDeclarationParser parser = new(Microsoft.Extensions.Logging.Abstractions.NullLogger<JsonInfrastructureDeclarationParser>.Instance);
        InfrastructureDeclarationReference declaration = new()
        {
            DeclarationId = "decl-1",
            Name = "network.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          { "type": "vnet", "name": " hub-vnet " }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> objects = await parser.ParseAsync(declaration, CancellationToken.None);

        objects.Should().ContainSingle();
        objects[0].Name.Should().Be("hub-vnet");
    }

    [Fact]
    public async Task DeltaAsync_PaddedResourceName_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new JsonInfrastructureDeclarationParser(Microsoft.Extensions.Logging.Abstractions.NullLogger<JsonInfrastructureDeclarationParser>.Instance)]),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "network.json",
                    Format = "json",
                    Content = """
                              {
                                "resources": [
                                  { "type": "vnet", "name": " hub-vnet " }
                                ]
                              }
                              """
                }
            ]
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "network.json",
                    Format = "json",
                    Content = """
                              {
                                "resources": [
                                  { "type": "vnet", "name": "hub-vnet" }
                                ]
                              }
                              """
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
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
