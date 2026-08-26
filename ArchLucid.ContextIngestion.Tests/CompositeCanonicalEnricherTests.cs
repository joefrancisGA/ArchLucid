using ArchLucid.ContextIngestion.Canonicalization;
using ArchLucid.ContextIngestion.Models;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for Canonical Infrastructure Enricher.
/// </summary>
[Trait("Category", "Unit")]
public sealed class CompositeCanonicalEnricherTests
{
    private readonly CompositeCanonicalEnricher _sut = new(
    [
        new TopologyResourceCanonicalEnricher(),
        new SecurityBaselineCanonicalEnricher(),
        new TerraformRuntimePlatformCanonicalEnricher(),
    ]);

    [Fact]
    public void Enrich_AddsCategory_ForJsonResourceTypes()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "TopologyResource",
                Name = "core-vnet",
                SourceType = "InfrastructureDeclaration",
                SourceId = "id",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["resourceType"] = "vnet", ["region"] = "eastus"
                }
            }
        ];

        IReadOnlyList<CanonicalObject> enriched = _sut.Enrich(items);

        enriched[0].Properties["category"].Should().Be("network");
    }

    [Fact]
    public void Enrich_classifies_kubernetes_deployment_as_compute()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "TopologyResource",
                Name = "prod/api",
                SourceType = "InfrastructureDeclaration",
                SourceId = "decl-k8s",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["k8s.kind"] = "deployment",
                    ["k8s.apiVersion"] = "apps/v1",
                    ["k8s.name"] = "api",
                    ["k8s.namespace"] = "prod",
                }
            }
        ];

        IReadOnlyList<CanonicalObject> enriched = _sut.Enrich(items);

        enriched[0].Properties["category"].Should().Be("compute");
    }

    [Fact]
    public void Enrich_AddsCategory_AndStatus_ForTerraformAndSecurity()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "TopologyResource",
                Name = "core",
                SourceType = "InfrastructureDeclaration",
                SourceId = "id",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["terraformType"] = "azurerm_virtual_network"
                }
            },

            new()
            {
                ObjectType = "SecurityBaseline",
                Name = "kv",
                SourceType = "InfrastructureDeclaration",
                SourceId = "id",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["terraformType"] = "azurerm_key_vault"
                }
            }
        ];

        IReadOnlyList<CanonicalObject> enriched = _sut.Enrich(items);

        enriched[0].Properties["category"].Should().Be("network");
        enriched[1].Properties["status"].Should().Be("declared");
    }

    [Fact]
    public void Enrich_sets_runtime_platform_for_aws_terraform_resource()
    {
        List<CanonicalObject> items =
        [
            new()
            {
                ObjectType = "TopologyResource",
                Name = "web",
                SourceType = "InfrastructureDeclaration",
                SourceId = "aws-id",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["terraformType"] = "aws_instance",
                },
            },
        ];

        IReadOnlyList<CanonicalObject> enriched = _sut.Enrich(items);

        enriched[0].Properties["runtimePlatform"].Should().Be("Ec2");
        enriched[0].Properties["category"].Should().Be("compute");
    }
}
