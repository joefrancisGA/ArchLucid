using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ManifestInfrastructureCostNodesNullEntryTests
{
    [Fact]
    public void FromGoldenTopology_skips_null_datastore_element_from_json()
    {
        // Manifest documents use JsonSerializerDefaults.Web. A null array element is retained.
        // CostSummaryArtifactGenerator passes that list into FromGoldenTopology.
        List<ManifestDatastore>? datastores = JsonSerializer.Deserialize<List<ManifestDatastore>>(
            """[null,{"datastoreName":"orders","runtimePlatform":6}]""",
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        datastores.Should().NotBeNull();
        datastores!.Any(static datastore => datastore is null).Should().BeTrue();

        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromGoldenTopology(null, datastores);

        nodes.Should().ContainSingle();
        nodes[0].DisplayName.Should().Be("orders");
        nodes[0].Platform.Should().Be(RuntimePlatform.SqlServer);
    }

    [Fact]
    public void FromExtractorInventory_skips_null_resource_element_from_json()
    {
        // Extractor resources.json is a JSON array. A null element is retained under Web defaults.
        List<AzureExtractorInventoryResourceLine>? resources = JsonSerializer.Deserialize<List<AzureExtractorInventoryResourceLine>>(
            """[null,{"name":"vm1","resourceType":"Microsoft.Compute/virtualMachines","location":"eastus","skuName":"Standard_D2s_v3"}]""",
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        resources.Should().NotBeNull();
        resources!.Any(static line => line is null).Should().BeTrue();

        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromExtractorInventory(resources);

        nodes.Should().ContainSingle();
        nodes[0].DisplayName.Should().Be("vm1");
        nodes[0].Platform.Should().Be(RuntimePlatform.Vm);
    }

    [Fact]
    public void FromAwsExtractorInventory_skips_null_resource_element_from_json()
    {
        // Extractor resources.json is a JSON array. A null element is retained under Web defaults.
        List<AzureExtractorInventoryResourceLine>? resources = JsonSerializer.Deserialize<List<AzureExtractorInventoryResourceLine>>(
            """[null,{"name":"web","resourceType":"AWS::EC2::Instance","location":"us-east-1","skuName":"t3.micro"}]""",
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        resources.Should().NotBeNull();
        resources!.Any(static line => line is null).Should().BeTrue();

        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromAwsExtractorInventory(resources);

        nodes.Should().ContainSingle();
        nodes[0].DisplayName.Should().Be("web");
        nodes[0].Platform.Should().Be(RuntimePlatform.Ec2);
    }

    [Fact]
    public void FromGcpExtractorInventory_skips_a_null_between_populated_rows()
    {
        List<AzureExtractorInventoryResourceLine>? resources = JsonSerializer.Deserialize<List<AzureExtractorInventoryResourceLine>>(
            """
            [
              {"name":"worker","resourceType":"compute.googleapis.com/Instance","location":"us-central1","skuName":"e2-medium"},
              null,
              {"name":"archive","resourceType":"storage.googleapis.com/Bucket","location":"us-east1"}
            ]
            """,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        resources.Should().NotBeNull();
        resources![1].Should().BeNull();

        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromGcpExtractorInventory(resources);

        nodes.Select(static node => node.DisplayName).Should().Equal("worker", "archive");
        nodes.Select(static node => node.Platform).Should().Equal(RuntimePlatform.ComputeEngine, RuntimePlatform.Gcs);
        nodes[0].ArmRegion.Should().Be("us-central1");
        nodes[0].SkuOrTier.Should().Be("e2-medium");
        nodes[1].SkuOrTier.Should().BeNull();
    }
}
