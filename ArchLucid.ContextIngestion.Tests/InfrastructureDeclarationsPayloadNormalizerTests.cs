using ArchLucid.ContextIngestion.ConnectorStages;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

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

    [Fact]
    public async Task NormalizeAsync_ArmBatch_IgnoresNonObjectResourceEntriesWhenIndexingLinks()
    {
        InfrastructureDeclarationsPayloadNormalizer normalizer = new([
            new ArmJsonInfrastructureDeclarationParser(NullLogger<ArmJsonInfrastructureDeclarationParser>.Instance),
        ]);

        InfrastructureDeclarationsPayload payload = new()
        {
            InfrastructureDeclarations =
            [
                new InfrastructureDeclarationReference
                {
                    Name = "main.json",
                    Format = "arm-json",
                    DeclarationId = "decl-main-arm",
                    Content = """
                              {
                                "resources": [
                                  "malformed-resource-entry",
                                  {
                                    "name": "orders",
                                    "type": "Microsoft.Storage/storageAccounts",
                                    "apiVersion": "2023-01-01",
                                    "properties": {}
                                  }
                                ]
                              }
                              """,
                },
            ],
        };

        NormalizedContextBatch batch = await normalizer.NormalizeAsync(payload, CancellationToken.None);

        batch.CanonicalObjects.Should().ContainSingle();
        batch.CanonicalObjects[0].Name.Should().Be("orders");
    }
}
