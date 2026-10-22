using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class CloudFormationInfrastructureDeclarationParserTests
{
    private readonly CloudFormationInfrastructureDeclarationParser _sut =
        new(NullLogger<CloudFormationInfrastructureDeclarationParser>.Instance);

    [Fact]
    public async Task ParseAsync_s3BucketWithPublicAccessBlock_MapsProperties()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "bucket.template.json",
            Format = "cloudformation",
            DeclarationId = "decl-cfn-bucket",
            Content = """
                      {
                        "AWSTemplateFormatVersion": "2010-09-09",
                        "Resources": {
                          "LogsBucket": {
                            "Type": "AWS::S3::Bucket",
                            "Properties": {
                              "BucketName": "logs-bucket",
                              "PublicAccessBlockConfiguration": {
                                "BlockPublicAcls": true
                              }
                            }
                          }
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ObjectType.Should().Be("TopologyResource");
        result[0].Name.Should().Be("logs-bucket");
        result[0].Properties.Should().ContainKey("tf.publicaccessblockconfiguration");
    }

    [Fact]
    public async Task ParseAsync_parametersOnlyTemplate_ReturnsEmpty()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "params-only.json",
            Format = "cloudformation",
            DeclarationId = "decl-cfn-params",
            Content = """
                      {
                        "AWSTemplateFormatVersion": "2010-09-09",
                        "Parameters": {
                          "Env": { "Type": "String" }
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task ParseAsync_refOnlyProperty_DoesNotInventScalar()
    {
        InfrastructureDeclarationReference declaration = new()
        {
            Name = "ref-only.json",
            Format = "cloudformation",
            DeclarationId = "decl-cfn-ref",
            Content = """
                      {
                        "Resources": {
                          "LogsBucket": {
                            "Type": "AWS::S3::Bucket",
                            "Properties": {
                              "BucketEncryption": { "Ref": "EncryptionConfig" }
                            }
                          }
                        }
                      }
                      """,
        };

        IReadOnlyList<CanonicalObject> result = await _sut.ParseAsync(declaration, CancellationToken.None);

        result.Should().ContainSingle();
        result[0].Properties.Keys.Should().NotContain(key => key.Contains("bucketencryption", StringComparison.OrdinalIgnoreCase));
    }
}
