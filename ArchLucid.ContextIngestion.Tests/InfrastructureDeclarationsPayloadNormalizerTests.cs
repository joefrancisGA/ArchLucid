using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class InfrastructureDeclarationsPayloadNormalizerTests
{
    [Fact]
    public async Task NormalizeAsync_BicepModuleBatch_IncludesModuleResourcesWithoutDuplicateStandaloneParse()
    {
        InfrastructureDeclarationsPayloadNormalizer normalizer = new([
            new BicepInfrastructureDeclarationParser(),
        ]);

        InfrastructureDeclarationsPayload payload = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    Name = "main.bicep",
                    Format = "bicep",
                    DeclarationId = "decl-main",
                    Content = """
                              module storageModule 'modules/storage.bicep' = {
                              }
                              """,
                },
                new InfrastructureDeclarationReference
                {
                    Name = "modules/storage.bicep",
                    Format = "bicep",
                    DeclarationId = "decl-module",
                    Content = """
                              resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
                              }
                              """,
                },
            ],
        };

        NormalizedContextBatch batch = await normalizer.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle(o => o.Name == "storage");
        batch.CanonicalObjects[0].SourceId.Should().Be("decl-module");
    }
}
