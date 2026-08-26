using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Json Infrastructure Declaration Parser.
/// </summary>
[Trait("Suite", "Core")]
public sealed class JsonInfrastructureDeclarationParserTests
{
    private readonly JsonInfrastructureDeclarationParser _sut =
        new(NullLogger<JsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_MapsVnetSubnetStorageApp_KeyVault()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          { "type": "vnet", "name": "core-vnet", "region": "eastus", "properties": { "addressSpace": "10.0.0.0/16" } },
                          { "type": "subnet", "name": "app-subnet", "region": "eastus", "properties": { "cidr": "10.0.1.0/24" } },
                          { "type": "storage", "name": "docstorage01", "region": "eastus", "properties": { "sku": "Standard_LRS" } },
                          { "type": "appservice", "name": "archlucid-api", "region": "eastus", "properties": { "plan": "P1v3" } },
                          { "type": "keyvault", "name": "archlucid-kv", "region": "eastus", "properties": {} }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(5);
        result.Count(o => o.ObjectType == "TopologyResource").Should().Be(4);
        result.Should().ContainSingle(o => o.ObjectType == "SecurityBaseline" && o.Name == "archlucid-kv");
        result.Should().Contain(o => o.Properties["resourceType"] == "vnet" && o.Properties["region"] == "eastus");
    }

    [Fact]
    public async Task ParseAsync_RegionAndSubtypeCasing_AreCanonicalized()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "vnet",
                            "name": "core-vnet",
                            "region": "EastUS",
                            "subtype": "Hub",
                            "properties": {}
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["region"].Should().Be("eastus");
        result[0].Properties["subtype"].Should().Be("hub");
    }

    [Fact]
    public async Task ParseAsync_ResourceNameCasing_IsCanonicalized()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          { "type": "vnet", "name": "Hub-Vnet" }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Name.Should().Be("hub-vnet");
    }

    [Fact]
    public async Task ParseAsync_CustomPropertyValues_AreCanonicalized()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "storage",
                            "name": "docstorage01",
                            "properties": { "sku": "Standard_LRS" }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["sku"].Should().Be("standard_lrs");
    }

    [Fact]
    public async Task ParseAsync_CustomPropertyKeys_AreCanonicalized()
    {
        InfrastructureDeclarationReference firstKeyCasing = new()
        {
            Name = "core.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "storage",
                            "name": "docstorage01",
                            "properties": { "Sku": "Standard_LRS" }
                          }
                        ]
                      }
                      """
        };

        InfrastructureDeclarationReference secondKeyCasing = new()
        {
            Name = "core.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "storage",
                            "name": "docstorage01",
                            "properties": { "sku": "standard_lrs" }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> firstObjects =
            await _sut.ParseAsync(firstKeyCasing, CancellationToken.None);
        IReadOnlyList<CanonicalObject> secondObjects =
            await _sut.ParseAsync(secondKeyCasing, CancellationToken.None);

        firstObjects.Should().ContainSingle();
        secondObjects.Should().ContainSingle();
        secondObjects[0].Properties.Should().BeEquivalentTo(firstObjects[0].Properties);
    }

    [Fact]
    public async Task ParseAsync_Reparse_ProducesStableObjectId()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.json",
            Format = "json",
            DeclarationId = "decl-json-stable",
            Content = """
                      {
                        "resources": [
                          { "type": "vnet", "name": "core-vnet", "region": "eastus" }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> firstParse = await _sut.ParseAsync(declaration, CancellationToken.None);
        IReadOnlyList<CanonicalObject> secondParse = await _sut.ParseAsync(declaration, CancellationToken.None);

        firstParse.Should().ContainSingle();
        secondParse.Should().ContainSingle();
        secondParse[0].ObjectId.Should().Be(firstParse[0].ObjectId);
    }

    [Fact]
    public async Task ParseAsync_NumericCustomProperty_MapsResource()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "core.json",
            Format = "json",
            Content = """
                      {
                        "resources": [
                          {
                            "type": "compute",
                            "name": "api-vm",
                            "properties": { "instanceCount": 2 }
                          }
                        ]
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["instancecount"].Should().Be("2");
    }
}
