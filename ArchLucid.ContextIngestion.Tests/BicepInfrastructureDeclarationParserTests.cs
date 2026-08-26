using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class BicepInfrastructureDeclarationParserTests
{
    private readonly BicepInfrastructureDeclarationParser _sut = new();

    [Fact]
    public async Task ParseAsync_ExtractsBicepResources()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                      }
                      resource kv 'Microsoft.KeyVault/vaults@2023-02-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o => o.Name == "storage" && o.ObjectType == "TopologyResource");
        result.Should().ContainSingle(o => o.Name == "kv" && o.ObjectType == "SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_ignores_quoted_symbolic_names_because_bicep_requires_identifiers()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource 'storage' 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ParseAsync_Reparse_ProducesStableObjectId()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-stable",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
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
    public async Task ParseAsync_DuplicateSymbolicNamesDifferentApiVersion_EmitsDistinctObjectIds()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-dup",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2021-01-01' = {
                      }
                      resource storage 'Microsoft.Storage/storageAccounts@2022-01-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(static o => o.ObjectId).Distinct().Should().HaveCount(2);
    }

    [Fact]
    public async Task ParseAsync_ModuleDeclaration_MapsStorageModule()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      module storageModule 'br/public:avm/res/storage/storage-account:0.3.0' = {
                        name: 'mystorage'
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        CanonicalObject module = result[0];
        module.Name.Should().Be("storagemodule");
        module.Properties.Should().ContainKey("bicepModule");
        module.Properties["bicepModule"].Should().Be("true");
        module.Properties["bicepSymbolicName"].Should().Be("storagemodule");
    }
}
