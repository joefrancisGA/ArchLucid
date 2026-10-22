using ArchLucid.ContextIngestion.Canonicalization;
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

    [Fact]
    public async Task DeltaAsync_JsonResourceNameCasingChange_ReportsUnchanged()
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
                                  { "type": "vnet", "name": "hub-vnet" }
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
                                  { "type": "vnet", "name": "Hub-Vnet" }
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

    [Fact]
    public async Task DeltaAsync_JsonCustomPropertyKeyCasingChange_ReportsUnchanged()
    {
        JsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<JsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string firstJson = """
                                 {
                                   "resources": [
                                     {
                                       "type": "storage",
                                       "name": "docstorage01",
                                       "properties": { "Sku": "Standard_LRS" }
                                     }
                                   ]
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "core.json",
                    Format = "json",
                    Content = firstJson
                }
            ]
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);
        CanonicalObject persistedObject = firstBatch.CanonicalObjects.Single();
        Dictionary<string, string> reloadedProperties = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, string> property in persistedObject.Properties)
            reloadedProperties[property.Key] = property.Value;

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = persistedObject.ObjectId,
                    ObjectType = persistedObject.ObjectType,
                    Name = persistedObject.Name,
                    SourceType = persistedObject.SourceType,
                    SourceId = persistedObject.SourceId,
                    Properties = reloadedProperties,
                }
            ],
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "core.json",
                    Format = "json",
                    Content = firstJson.Replace("\"Sku\"", "\"sku\"")
                        .Replace("\"Standard_LRS\"", "\"standard_lrs\"")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonTfPropertyKeyCasingChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string firstJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_resource_group",
                                           "name": "main",
                                           "values": { "Location": "EastUS" }
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = firstJson
                }
            ]
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);
        CanonicalObject persistedObject = firstBatch.CanonicalObjects.Single();
        Dictionary<string, string> reloadedProperties = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, string> property in persistedObject.Properties)
            reloadedProperties[property.Key] = property.Value;

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = persistedObject.ObjectId,
                    ObjectType = persistedObject.ObjectType,
                    Name = persistedObject.Name,
                    SourceType = persistedObject.SourceType,
                    SourceId = persistedObject.SourceId,
                    Properties = reloadedProperties,
                }
            ],
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = firstJson.Replace("\"Location\"", "\"location\"")
                        .Replace("\"EastUS\"", "\"eastus\"")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformTypeCasingChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new SimpleTerraformDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = "resource \"azurerm_virtual_network\" \"core\"\n"
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
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = "resource \"azurerm_Virtual_Network\" \"core\"\n"
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task NormalizeAsync_PaddedJsonFormat_ParsesDeclaration()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new JsonInfrastructureDeclarationParser(Microsoft.Extensions.Logging.Abstractions.NullLogger<JsonInfrastructureDeclarationParser>.Instance)]),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "network.json",
                    Format = " json ",
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

        NormalizedContextBatch batch = await connector.NormalizeAsync(raw, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.Warnings.Should().BeEmpty();
        batch.CanonicalObjects[0].Name.Should().Be("hub-vnet");
    }

    [Fact]
    public async Task DeltaAsync_PaddedSimpleTerraformResourceName_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new SimpleTerraformDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = "resource \"azurerm_virtual_network\" \"hub-vnet\"\n"
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
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = "resource \"azurerm_virtual_network\" \" hub-vnet \"\n"
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_SimpleTerraformResourceNameCasingChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new SimpleTerraformDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = "resource \"azurerm_virtual_network\" \"hub-vnet\"\n"
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
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = "resource \"azurerm_virtual_network\" \"Hub-Vnet\"\n"
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonTypeCasingChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_virtual_network",
                                           "name": "core",
                                           "values": {}
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson.Replace("azurerm_virtual_network", "azurerm_Virtual_Network")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task NormalizeAsync_PaddedTerraformShowJsonFormat_ParsesDeclaration()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = " terraform-show-json ",
                    Content = """
                              {
                                "values": {
                                  "root_module": {
                                    "resources": [
                                      {
                                        "type": "azurerm_virtual_network",
                                        "name": "core",
                                        "values": {}
                                      }
                                    ]
                                  }
                                }
                              }
                              """
                }
            ]
        };

        NormalizedContextBatch batch = await connector.NormalizeAsync(raw, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.Warnings.Should().BeEmpty();
        batch.CanonicalObjects[0].Properties["terraformType"].Should().Be("azurerm_virtual_network");
    }

    [Fact]
    public async Task DeltaAsync_PaddedTerraformShowJsonResourceName_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_virtual_network",
                                           "name": "core",
                                           "values": {}
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson.Replace("\"name\": \"core\"", "\"name\": \" core \"")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonResourceNameCasingChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJsonLower = """
                                      {
                                        "values": {
                                          "root_module": {
                                            "resources": [
                                              {
                                                "type": "azurerm_virtual_network",
                                                "name": "hub-vnet",
                                                "values": {}
                                              }
                                            ]
                                          }
                                        }
                                      }
                                      """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJsonLower
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJsonLower.Replace("\"name\": \"hub-vnet\"", "\"name\": \"Hub-Vnet\"")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_JsonRegionSubtypeCasingChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new JsonInfrastructureDeclarationParser(Microsoft.Extensions.Logging.Abstractions.NullLogger<JsonInfrastructureDeclarationParser>.Instance)]),
            new SetDiffConnectorDeltaComputer());

        const string json = """
                            {
                              "resources": [
                                {
                                  "type": "vnet",
                                  "name": "hub-vnet",
                                  "region": "eastus",
                                  "subtype": "hub"
                                }
                              ]
                            }
                            """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "network.json",
                    Format = "json",
                    Content = json
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
                    Content = json.Replace("\"eastus\"", "\"EastUS\"").Replace("\"hub\"", "\"Hub\"")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonModeProviderCasingChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_resource_group",
                                           "name": "main",
                                           "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                           "mode": "managed",
                                           "values": {}
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
                        .Replace("\"mode\": \"managed\"", "\"mode\": \"Managed\"")
                        .Replace(
                            "registry.terraform.io/hashicorp/azurerm",
                            "Registry.Terraform.IO/HashiCorp/Azurerm")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_PaddedSimpleTerraformResourceType_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new SimpleTerraformDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = "resource \"azurerm_virtual_network\" \"core\"\n"
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
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = "resource \" azurerm_virtual_network \" \"core\"\n"
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_SimpleTerraformNestedBlockNameCasingChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new SimpleTerraformDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        const string lowerBlock = """
                                  resource "azurerm_linux_web_app" "api" {
                                    site_config {
                                      always_on = true
                                    }
                                  }
                                  """;

        const string mixedBlock = """
                                  resource "azurerm_linux_web_app" "api" {
                                    Site_Config {
                                      always_on = true
                                    }
                                  }
                                  """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "app.tf",
                    Format = "simple-terraform",
                    Content = lowerBlock,
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
                    Name = "app.tf",
                    Format = "simple-terraform",
                    Content = mixedBlock,
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonDependsOnCasingChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_storage_account",
                                           "name": "st",
                                           "values": { "name": "s" },
                                           "depends_on": ["azurerm_resource_group.main"]
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson.Replace("azurerm_resource_group.main", "azurerm_Resource_Group.Main")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonDependsOnOrderChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_storage_account",
                                           "name": "st",
                                           "values": { "name": "s" },
                                           "depends_on": ["azurerm_resource_group.main", "azurerm_virtual_network.hub"]
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson.Replace(
                        """["azurerm_resource_group.main", "azurerm_virtual_network.hub"]""",
                        """["azurerm_virtual_network.hub", "azurerm_resource_group.main"]""")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonComplexTfJsonCasingChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_resource_group",
                                           "name": "main",
                                           "values": {
                                             "tags": { "Environment": "Prod" }
                                           }
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson.Replace("\"Environment\": \"Prod\"", "\"environment\": \"prod\"")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonEquivalentNumericFormatChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_service_plan",
                                           "name": "main",
                                           "values": {
                                             "worker_count": 1
                                           }
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson.Replace("\"worker_count\": 1", "\"worker_count\": 1.0")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonScientificNotationNumericChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_service_plan",
                                           "name": "main",
                                           "values": {
                                             "worker_count": 1
                                           }
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson.Replace("\"worker_count\": 1", "\"worker_count\": 1e0")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonBooleanStringChange_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJson = """
                                 {
                                   "values": {
                                     "root_module": {
                                       "resources": [
                                         {
                                           "type": "azurerm_linux_web_app",
                                           "name": "main",
                                           "values": {
                                             "https_only": true
                                           }
                                         }
                                       ]
                                     }
                                   }
                                 }
                                 """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJson.Replace("\"https_only\": true", "\"https_only\": \"true\"")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonNullVsMissingTfValue_ReportsUnchanged()
    {
        TerraformShowJsonInfrastructureDeclarationParser parser =
            new(Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string stateJsonMissing = """
                                        {
                                          "values": {
                                            "root_module": {
                                              "resources": [
                                                {
                                                  "type": "azurerm_linux_web_app",
                                                  "name": "main",
                                                  "values": { "location": "eastus" }
                                                }
                                              ]
                                            }
                                          }
                                        }
                                        """;

        const string stateJsonNull = """
                                     {
                                       "values": {
                                         "root_module": {
                                           "resources": [
                                             {
                                               "type": "azurerm_linux_web_app",
                                               "name": "main",
                                               "values": {
                                                 "location": "eastus",
                                                 "client_affinity_enabled": null
                                               }
                                             }
                                           ]
                                         }
                                       }
                                     }
                                     """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-1",
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJsonMissing
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
                    Name = "state.json",
                    Format = "terraform-show-json",
                    Content = stateJsonNull
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

    [Fact]
    public async Task DeltaAsync_AppServiceExpandedBaselines_ReportsUnchangedOnIdenticalReIngest()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([]),
            new SetDiffConnectorDeltaComputer());

        NormalizedContextBatch normalizedBatch = new();
        normalizedBatch.CanonicalObjects.Add(new CanonicalObject
        {
            ObjectType = "TopologyResource",
            Name = "web-app",
            SourceType = "InfrastructureDeclaration",
            SourceId = "decl-1",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["resourceType"] = "Microsoft.Web/sites",
                ["ipSecurityRestrictions"] =
                    """[{"name":"AllowAll","ipAddress":"0.0.0.0/0","action":"Allow"}]""",
            },
        });

        CompositeCanonicalEnricher enricher = new(
        [
            new TopologyResourceCanonicalEnricher(),
            new SecurityBaselineCanonicalEnricher(),
        ]);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects = enricher.Enrich(normalizedBatch.CanonicalObjects).ToList(),
        };

        ContextDelta delta = await connector.DeltaAsync(normalizedBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_ArmJsonEquivalentNumericFormatChange_ReportsUnchanged()
    {
        ArmJsonInfrastructureDeclarationParser parser = new(
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ArmJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string templateJson = """
                                    {
                                      "resources": [
                                        {
                                          "type": "Microsoft.Web/serverfarms",
                                          "name": "main",
                                          "properties": {
                                            "capacity": 1
                                          }
                                        }
                                      ]
                                    }
                                    """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-arm-1",
                    Name = "template.json",
                    Format = "arm-json",
                    Content = templateJson
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
                    DeclarationId = "decl-arm-1",
                    Name = "template.json",
                    Format = "arm-json",
                    Content = templateJson.Replace("\"capacity\": 1", "\"capacity\": 1.0")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_ArmJsonTfPropertyKeyCasingChange_ReportsUnchanged()
    {
        ArmJsonInfrastructureDeclarationParser parser = new(
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ArmJsonInfrastructureDeclarationParser>.Instance);

        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([parser]),
            new SetDiffConnectorDeltaComputer());

        const string templateJson = """
                                    {
                                      "resources": [
                                        {
                                          "type": "Microsoft.Storage/storageAccounts",
                                          "name": "docs",
                                          "properties": {
                                            "allowBlobPublicAccess": true
                                          }
                                        }
                                      ]
                                    }
                                    """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-arm-2",
                    Name = "template.json",
                    Format = "arm-json",
                    Content = templateJson
                }
            ]
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);
        CanonicalObject persistedObject = firstBatch.CanonicalObjects.Single();
        Dictionary<string, string> reloadedProperties = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, string> property in persistedObject.Properties)
            reloadedProperties[property.Key] = property.Value;

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid().ToString("D"),
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = persistedObject.ObjectId,
                    ObjectType = persistedObject.ObjectType,
                    Name = persistedObject.Name,
                    SourceType = persistedObject.SourceType,
                    SourceId = persistedObject.SourceId,
                    Properties = reloadedProperties,
                }
            ],
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-arm-2",
                    Name = "template.json",
                    Format = "arm-json",
                    Content = templateJson.Replace("\"allowBlobPublicAccess\"", "\"allowblobpublicaccess\"")
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);

        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_KubernetesDeploymentAndServiceSameClusterName_CountsBothResources()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new KubernetesJsonInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesJsonInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cluster.json",
            Format = "kubernetes-json",
            DeclarationId = "decl-k8s-collision",
            Content = """
                      {
                        "apiVersion": "v1",
                        "kind": "List",
                        "items": [
                          {
                            "apiVersion": "apps/v1",
                            "kind": "Deployment",
                            "metadata": { "name": "api" }
                          },
                          {
                            "apiVersion": "v1",
                            "kind": "Service",
                            "metadata": { "name": "api" }
                          }
                        ]
                      }
                      """,
        };

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations = [declaration],
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        firstBatch.CanonicalObjects.Should().HaveCount(2);

        ContextDelta firstDelta = await connector.DeltaAsync(firstBatch, previous: null, CancellationToken.None);

        firstDelta.AddedCount.Should().Be(2);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        ContextDelta secondDelta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        secondDelta.ModifiedCount.Should().Be(0);
        secondDelta.UnchangedCount.Should().Be(2);
        secondDelta.AddedCount.Should().Be(0);
        secondDelta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_JsonSameTypeNameSubtypeRegionDifferentCustomProperties_CountsBothResources()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new JsonInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<JsonInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "network.json",
            Format = "json",
            DeclarationId = "decl-json-custom-props",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "vnet",
                            "name": "hub",
                            "subtype": "hub",
                            "region": "eastus",
                            "properties": { "cidr": "10.0.0.0/16" }
                          },
                          {
                            "type": "vnet",
                            "name": "hub",
                            "subtype": "hub",
                            "region": "eastus",
                            "properties": { "cidr": "10.1.0.0/16" }
                          }
                        ]
                      }
                      """,
        };

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations = [declaration],
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        firstBatch.CanonicalObjects.Should().HaveCount(2);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        ContextDelta secondDelta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        secondDelta.UnchangedCount.Should().Be(2);
        secondDelta.AddedCount.Should().Be(0);
        secondDelta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_DuplicateSimpleTerraformResourceBlocks_CountsBothResources()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new SimpleTerraformDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        const string content = """
                               resource "azurerm_subnet" "app" {
                                 address_prefixes = ["10.0.1.0/24"]
                               }
                               resource "azurerm_subnet" "app" {
                                 address_prefixes = ["10.0.2.0/24"]
                               }
                               """;

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-tf-dup",
                    Name = "dup.tf",
                    Format = "simple-terraform",
                    Content = content,
                }
            ]
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        firstBatch.CanonicalObjects.Should().HaveCount(2);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        ContextDelta secondDelta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        secondDelta.UnchangedCount.Should().Be(2);
        secondDelta.AddedCount.Should().Be(0);
        secondDelta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonDuplicateRootLabel_CountsBothResources()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new TerraformShowJsonInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "state.json",
            Format = "terraform-show-json",
            DeclarationId = "decl-tfshow-dup-root",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "azurerm_subnet",
                                "name": "this",
                                "mode": "managed",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "values": { "address_prefix": "10.0.1.0/24" }
                              },
                              {
                                "type": "azurerm_subnet",
                                "name": "this",
                                "mode": "managed",
                                "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                "values": { "address_prefix": "10.0.2.0/24" }
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations = [declaration],
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        firstBatch.CanonicalObjects.Should().HaveCount(2);

        ContextDelta firstDelta = await connector.DeltaAsync(firstBatch, previous: null, CancellationToken.None);

        firstDelta.AddedCount.Should().Be(2);
    }

    [Fact]
    public async Task DeltaAsync_JsonSameTypeNameDifferentSubtype_CountsBothResources()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new JsonInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<JsonInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "network.json",
            Format = "json",
            DeclarationId = "decl-json-subtype",
            Content = """
                      {
                        "resources": [
                          { "type": "vnet", "name": "hub", "subtype": "hub", "region": "eastus" },
                          { "type": "vnet", "name": "hub", "subtype": "spoke", "region": "westus" }
                        ]
                      }
                      """,
        };

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations = [declaration],
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        firstBatch.CanonicalObjects.Should().HaveCount(2);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        ContextDelta secondDelta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        secondDelta.UnchangedCount.Should().Be(2);
        secondDelta.AddedCount.Should().Be(0);
        secondDelta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_TerraformShowJsonSiblingModulesSameLabel_CountsBothResources()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new TerraformShowJsonInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "state.json",
            Format = "terraform-show-json",
            DeclarationId = "decl-tfshow-sibling-modules",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [],
                            "child_modules": [
                              {
                                "address": "module.network",
                                "resources": [
                                  {
                                    "address": "module.network.azurerm_subnet.this",
                                    "type": "azurerm_subnet",
                                    "name": "this",
                                    "mode": "managed",
                                    "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                    "values": { "name": "subnet-a" }
                                  }
                                ]
                              },
                              {
                                "address": "module.data",
                                "resources": [
                                  {
                                    "address": "module.data.azurerm_subnet.this",
                                    "type": "azurerm_subnet",
                                    "name": "this",
                                    "mode": "managed",
                                    "provider_name": "registry.terraform.io/hashicorp/azurerm",
                                    "values": { "name": "subnet-b" }
                                  }
                                ]
                              }
                            ]
                          }
                        }
                      }
                      """,
        };

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations = [declaration],
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        firstBatch.CanonicalObjects.Should().HaveCount(2);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        ContextDelta secondDelta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        secondDelta.UnchangedCount.Should().Be(2);
        secondDelta.AddedCount.Should().Be(0);
        secondDelta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_ArmJsonCompositeSubnetNames_CountsBothResources()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new ArmJsonInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<ArmJsonInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-composite-subnets",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Network/virtualNetworks/subnets",
                            "name": ["hub-vnet", "subnet-a"],
                            "properties": { "addressPrefix": "10.0.1.0/24" }
                          },
                          {
                            "type": "Microsoft.Network/virtualNetworks/subnets",
                            "name": ["hub-vnet", "subnet-b"],
                            "properties": { "addressPrefix": "10.0.2.0/24" }
                          }
                        ]
                      }
                      """,
        };

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations = [declaration],
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        firstBatch.CanonicalObjects.Should().HaveCount(2);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(raw, CancellationToken.None);

        ContextDelta secondDelta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        secondDelta.UnchangedCount.Should().Be(2);
        secondDelta.AddedCount.Should().Be(0);
        secondDelta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_DuplicateKubernetesDeployments_CountsBothResources()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new KubernetesYamlInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<KubernetesYamlInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        InfrastructureDeclarationReference declaration = new()
        {
            Name = "dup.yaml",
            Format = "kubernetes-yaml",
            DeclarationId = "decl-k8s-dup-delta",
            Content = """
                      apiVersion: apps/v1
                      kind: Deployment
                      metadata:
                        name: api
                        namespace: prod
                      ---
                      apiVersion: apps/v1
                      kind: Deployment
                      metadata:
                        name: api
                        namespace: prod
                      """,
        };

        RawContextPayload raw = new()
        {
            InfrastructureDeclarations = [declaration],
        };

        NormalizedContextBatch batch = await connector.NormalizeAsync(raw, CancellationToken.None);

        batch.CanonicalObjects.Should().HaveCount(2);

        ContextDelta delta = await connector.DeltaAsync(batch, null, CancellationToken.None);

        delta.AddedCount.Should().Be(2);
    }

    [Fact]
    public async Task DeltaAsync_ArmJsonArrayPropertyCasingChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new ArmJsonInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<ArmJsonInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        static InfrastructureDeclarationReference CreateDeclaration(string restrictionsJson) => new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-array-delta",
            Content = $$"""
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Web/sites",
                            "name": "web-app",
                            "properties": {
                              "ipSecurityRestrictions": {{restrictionsJson}}
                            }
                          }
                        ]
                      }
                      """,
        };

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                CreateDeclaration(
                    """[{"name":"AllowAll","ipAddress":"0.0.0.0/0","action":"Allow"}]"""),
            ],
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                CreateDeclaration(
                    """[{"Name":"AllowAll","IpAddress":"0.0.0.0/0","Action":"Allow"}]"""),
            ],
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);
        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_ArmJsonArrayPropertyOrderChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([
                new ArmJsonInfrastructureDeclarationParser(
                    Microsoft.Extensions.Logging.Abstractions.NullLogger<ArmJsonInfrastructureDeclarationParser>.Instance),
            ]),
            new SetDiffConnectorDeltaComputer());

        static InfrastructureDeclarationReference CreateDeclaration(string restrictionsJson) => new()
        {
            Name = "template.json",
            Format = "arm-json",
            DeclarationId = "decl-arm-array-order-delta",
            Content = $$"""
                      {
                        "resources": [
                          {
                            "type": "Microsoft.Web/sites",
                            "name": "web-app",
                            "properties": {
                              "ipSecurityRestrictions": {{restrictionsJson}}
                            }
                          }
                        ]
                      }
                      """,
        };

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                CreateDeclaration(
                    """[{"name":"AllowAll","ipAddress":"0.0.0.0/0","action":"Allow"},{"name":"DenyAll","ipAddress":"255.255.255.255/32","action":"Deny"}]"""),
            ],
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                CreateDeclaration(
                    """[{"name":"DenyAll","ipAddress":"255.255.255.255/32","action":"Deny"},{"name":"AllowAll","ipAddress":"0.0.0.0/0","action":"Allow"}]"""),
            ],
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);
        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_BicepInlineSlashSlashCommentChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new BicepInfrastructureDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        const string contentWithComment = """
                                          resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                                            properties: {
                                              publicNetworkAccess: 'Enabled' // primary region
                                            }
                                          }
                                          """;

        const string contentWithoutComment = """
                                             resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                                               properties: {
                                                 publicNetworkAccess: 'Enabled'
                                               }
                                             }
                                             """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-bicep-comment",
                    Name = "main.bicep",
                    Format = "bicep",
                    Content = contentWithComment,
                }
            ]
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-bicep-comment",
                    Name = "main.bicep",
                    Format = "bicep",
                    Content = contentWithoutComment,
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);
        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_BicepInlineHashCommentChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new BicepInfrastructureDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        const string contentWithComment = """
                                          resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                                            properties: {
                                              publicNetworkAccess: 'Enabled' # primary region
                                            }
                                          }
                                          """;

        const string contentWithoutComment = """
                                             resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                                               properties: {
                                                 publicNetworkAccess: 'Enabled'
                                               }
                                             }
                                             """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-bicep-hash-comment",
                    Name = "main.bicep",
                    Format = "bicep",
                    Content = contentWithComment,
                }
            ]
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-bicep-hash-comment",
                    Name = "main.bicep",
                    Format = "bicep",
                    Content = contentWithoutComment,
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);
        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }

    [Fact]
    public async Task DeltaAsync_SimpleTerraformInlineSlashSlashCommentChange_ReportsUnchanged()
    {
        InfrastructureDeclarationConnector connector = new(
            new InfrastructureDeclarationsPayloadExtractor(),
            new InfrastructureDeclarationsPayloadNormalizer([new SimpleTerraformDeclarationParser()]),
            new SetDiffConnectorDeltaComputer());

        const string contentWithComment = """
                                          resource "azurerm_resource_group" "rg" {
                                            location = "eastus" // primary region
                                          }
                                          """;

        const string contentWithoutComment = """
                                             resource "azurerm_resource_group" "rg" {
                                               location = "eastus"
                                             }
                                             """;

        RawContextPayload firstRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-tf-comment",
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = contentWithComment,
                }
            ]
        };

        NormalizedContextBatch firstBatch = await connector.NormalizeAsync(firstRaw, CancellationToken.None);

        ContextSnapshot previous = new()
        {
            SnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ProjectId = "p",
            CanonicalObjects = firstBatch.CanonicalObjects,
        };

        RawContextPayload secondRaw = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    DeclarationId = "decl-tf-comment",
                    Name = "core.tf",
                    Format = "simple-terraform",
                    Content = contentWithoutComment,
                }
            ]
        };

        NormalizedContextBatch secondBatch = await connector.NormalizeAsync(secondRaw, CancellationToken.None);
        ContextDelta delta = await connector.DeltaAsync(secondBatch, previous, CancellationToken.None);

        delta.UnchangedCount.Should().Be(1);
        delta.ModifiedCount.Should().Be(0);
        delta.AddedCount.Should().Be(0);
        delta.RemovedCount.Should().Be(0);
    }
}
