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
    public async Task ParseAsync_ExtractsPublicNetworkAccessFromPropertiesBlock()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Enabled'
                          allowBlobPublicAccess: true
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("enabled");
        result[0].Properties["publicNetworkAccess"].Should().Be("enabled");
        result[0].Properties["tf.allowblobpublicaccess"].Should().Be("true");
        result[0].Properties["allowBlobPublicAccess"].Should().Be("true");
    }

    [Fact]
    public async Task ParseAsync_InlineSlashSlashComment_DoesNotChangeTfPublicNetworkAccess()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Enabled' // primary region
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("enabled");
    }

    [Fact]
    public async Task ParseAsync_PropertyChanges_DoNotChangeObjectId()
    {
        InfrastructureDeclarationReference enabled = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-public",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Enabled'
                        }
                      }
                      """
        };

        InfrastructureDeclarationReference disabled = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-public",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: 'Disabled'
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> enabledObjects = await _sut.ParseAsync(enabled, CancellationToken.None);
        IReadOnlyList<CanonicalObject> disabledObjects = await _sut.ParseAsync(disabled, CancellationToken.None);

        enabledObjects.Should().ContainSingle();
        disabledObjects.Should().ContainSingle();
        disabledObjects[0].ObjectId.Should().Be(enabledObjects[0].ObjectId);
    }
}
