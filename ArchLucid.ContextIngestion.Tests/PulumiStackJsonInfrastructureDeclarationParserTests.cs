using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class PulumiStackJsonInfrastructureDeclarationParserTests
{
    private readonly PulumiStackJsonInfrastructureDeclarationParser _sut =
        new(NullLogger<PulumiStackJsonInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_storageAccountWithAllowBlobPublicAccess_MapsSecurityProperties()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "stack.json",
            Format = "pulumi-stack-json",
            DeclarationId = "decl-pulumi-stack",
            Content = """
                      {
                        "version": 3,
                        "deployment": {
                          "resources": [
                            {
                              "urn": "urn:pulumi:dev::proj::azure-native:storage:StorageAccount::orders",
                              "type": "azure-native:storage:StorageAccount",
                              "outputs": {
                                "allowBlobPublicAccess": false,
                                "name": "ordersacct"
                              }
                            }
                          ]
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("TopologyResource");
        result[0].Name.Should().Be("ordersacct");
        result[0].Properties.Should().ContainKey("allowBlobPublicAccess");
        result[0].Properties["allowBlobPublicAccess"].Should().Be("false");
    }

    [Fact]
    public async Task ParseAsync_providerOnlyExport_ReturnsEmpty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "stack.json",
            Format = "pulumi-stack-json",
            DeclarationId = "decl-pulumi-provider",
            Content = """
                      {
                        "version": 3,
                        "deployment": {
                          "resources": [
                            {
                              "type": "pulumi:providers:azure-native",
                              "urn": "urn:pulumi:dev::proj::pulumi:providers:azure-native::default"
                            }
                          ]
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ParseAsync_nonStackProgramSource_ReturnsEmpty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "index.ts",
            Format = "pulumi-stack-json",
            DeclarationId = "decl-pulumi-ts",
            Content = """
                      import * as pulumi from "@pulumi/pulumi";
                      export const bucket = new aws.s3.Bucket("logs");
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().BeEmpty();
    }
}
