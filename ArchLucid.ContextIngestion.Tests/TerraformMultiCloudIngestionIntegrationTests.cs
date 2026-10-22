using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>Parse → enrich integration coverage for AWS/GCP terraform-show-json (TB-874).</summary>
[Trait("Category", "Unit")]
public sealed class TerraformMultiCloudIngestionIntegrationTests
{
    private readonly TerraformShowJsonInfrastructureDeclarationParser _parser =
        new(NullLogger<TerraformShowJsonInfrastructureDeclarationParser>.Instance);

    private readonly CompositeCanonicalEnricher _enricher = new(
    [
        new TopologyResourceCanonicalEnricher(),
        new SecurityBaselineCanonicalEnricher(),
        new TerraformRuntimePlatformCanonicalEnricher(),
    ]);

    [Fact]
    public async Task Aws_terraform_show_json_parse_and_enrich_sets_provider_native_metadata()
    {
        InfrastructureDeclarationReference decl = new()
        {
            Name = "aws-module",
            Format = "terraform-show-json",
            DeclarationId = "aws-integration",
            Content = """
                      {
                        "values": {
                          "root_module": {
                            "resources": [
                              {
                                "type": "aws_vpc",
                                "name": "main",
                                "provider_name": "registry.terraform.io/hashicorp/aws",
                                "mode": "managed",
                                "values": { "cidr_block": "10.0.0.0/16" }
                              },
                              {
                                "type": "aws_instance",
                                "name": "web",
                                "provider_name": "registry.terraform.io/hashicorp/aws",
                                "mode": "managed",
                                "values": { "instance_type": "t3.micro" }
                              },
                              {
                                "type": "aws_security_group",
                                "name": "web",
                                "provider_name": "registry.terraform.io/hashicorp/aws",
                                "mode": "managed",
                                "values": {}
                              }
                            ]
                          }
                        }
                      }
                      """
        };

        IReadOnlyList<CanonicalObject> parsed = await _parser.ParseAsync(decl, CancellationToken.None);
        IReadOnlyList<CanonicalObject> enriched = _enricher.Enrich(parsed);

        enriched.Should().HaveCount(3);
        enriched.Should().OnlyContain(o => o.Properties["providerName"] == "registry.terraform.io/hashicorp/aws");

        CanonicalObject instance = enriched.Single(o => o.Properties["terraformType"] == "aws_instance");
        instance.Properties["runtimePlatform"].Should().Be("Ec2");
        instance.Properties["category"].Should().Be("compute");

        CanonicalObject vpc = enriched.Single(o => o.Properties["terraformType"] == "aws_vpc");
        vpc.Properties["category"].Should().Be("network");

        enriched.Single(o => o.Properties["terraformType"] == "aws_security_group")
            .ObjectType.Should().Be("SecurityBaseline");
    }
}
