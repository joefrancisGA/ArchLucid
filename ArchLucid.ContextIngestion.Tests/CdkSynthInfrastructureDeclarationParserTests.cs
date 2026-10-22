using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class CdkSynthInfrastructureDeclarationParserTests
{
    private readonly CdkSynthInfrastructureDeclarationParser _sut =
        new(NullLogger<CdkSynthInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_cdkOutTemplateJson_MapsS3Bucket()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "cdk.out/Stack.template.json",
            Format = "cdk-synth",
            DeclarationId = "decl-cdk-template",
            Content = """
                      {
                        "Resources": {
                          "AppBucket": {
                            "Type": "AWS::S3::Bucket",
                            "Properties": {
                              "BucketName": "app-data"
                            }
                          }
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("TopologyResource");
        result[0].Name.Should().Be("app-data");
    }

    [Fact]
    public async Task ParseAsync_cdkAppSourceFile_ReturnsEmpty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "bin/app.ts",
            Format = "cdk-synth",
            DeclarationId = "decl-cdk-app",
            Content = """
                      import * as cdk from 'aws-cdk-lib';
                      export class AppStack extends cdk.Stack {}
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().BeEmpty();
    }
}
