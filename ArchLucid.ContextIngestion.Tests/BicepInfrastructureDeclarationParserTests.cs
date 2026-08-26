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
    public async Task ParseAsync_ExtractsBicepModules()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-module",
            Content = """
                      module storageModule 'br/public:avm/res/storage/storage-account:0.8.0' = {
                      }
                      resource kv 'Microsoft.KeyVault/vaults@2023-02-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Should().ContainSingle(o =>
            o.Name == "storagemodule"
            && o.ObjectType == "TopologyResource"
            && o.Properties["bicepModuleSource"] == "br/public:avm/res/storage/storage-account:0.8.0");
        result.Should().ContainSingle(o => o.Name == "kv" && o.ObjectType == "SecurityBaseline");
    }

    [Fact]
    public async Task ParseAsync_DuplicateResourceSymbolicNames_EmitsDistinctObjectIds()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-occurrence",
            Content = """
                      resource stg 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                      }
                      resource stg 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().HaveCount(2);
        result.Select(o => o.ObjectId).Distinct().Should().HaveCount(2);
        result.Should().OnlyContain(o => o.Properties.ContainsKey("bicepOccurrence"));
    }
}
