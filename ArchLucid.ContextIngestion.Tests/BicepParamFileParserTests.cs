using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class BicepParamFileParserTests
{
    private readonly BicepInfrastructureDeclarationParser _bicepParser = new();

    [Fact]
    public void TryParse_ExtractsUsingPathAndParamAssignments()
    {
        bool parsed = BicepParamFileParser.TryParse(
            """
            using '../main.bicep'

            param skuName = 'Premium'
            param allowPublic = true
            """,
            out string? bicepRelativePath,
            out Dictionary<string, string> parameters);

        parsed.Should().BeTrue();
        bicepRelativePath.Should().Be("../main.bicep");
        parameters["skuName"].Should().Be("Premium");
        parameters["allowPublic"].Should().Be("true");
    }

    [Fact]
    public async Task NormalizeAsync_BicepParamInBatch_SubstitutesScalarParamOnResource()
    {
        InfrastructureDeclarationsPayloadNormalizer normalizer = new([_bicepParser]);

        InfrastructureDeclarationsPayload payload = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    Name = "main.bicepparam",
                    Format = "bicep-param",
                    DeclarationId = "decl-bicep-param",
                    Content = """
                              using 'main.bicep'

                              param skuName = 'Premium'
                              """,
                },
                new InfrastructureDeclarationReference
                {
                    Name = "main.bicep",
                    Format = "bicep",
                    DeclarationId = "decl-bicep-main",
                    Content = """
                              resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                                properties: {
                                  publicNetworkAccess: skuName
                                }
                              }
                              """,
                },
            ],
        };

        NormalizedContextBatch batch = await normalizer.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.CanonicalObjects[0].Properties["tf.publicnetworkaccess"].Should().Be("premium");
        batch.CanonicalObjects[0].Properties["publicNetworkAccess"].Should().Be("premium");
    }

    [Fact]
    public async Task NormalizeAsync_UnresolvedBicepParamReference_IsNoOp()
    {
        InfrastructureDeclarationsPayloadNormalizer normalizer = new([_bicepParser]);

        InfrastructureDeclarationsPayload payload = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    Name = "main.bicepparam",
                    Format = "bicep-param",
                    DeclarationId = "decl-bicep-param",
                    Content = """
                              using 'missing/main.bicep'

                              param skuName = 'Premium'
                              """,
                },
            ],
        };

        NormalizedContextBatch batch = await normalizer.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().BeEmpty();
    }

    [Fact]
    public async Task ParseAsync_UnresolvedParamIdentifier_StaysUnsubstituted()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "main.bicep",
            Format = "bicep",
            DeclarationId = "decl-bicep-unresolved",
            Content = """
                      resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                        properties: {
                          publicNetworkAccess: skuName
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _bicepParser.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties["tf.publicnetworkaccess"].Should().Be("skuname");
        result[0].Properties["publicNetworkAccess"].Should().Be("skuname");
    }
}
