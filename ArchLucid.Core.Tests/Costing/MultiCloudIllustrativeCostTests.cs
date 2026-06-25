using ArchLucid.Contracts.Common;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class MultiCloudIllustrativeCostTests
{
    [Fact]
    public async Task EstimateNodesAsync_aws_terraform_rows_use_aws_product_labels()
    {
        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromTerraformResourceRows([
            new TerraformInfrastructureCostResourceRow("web", "aws_instance", "us-east-1"),
            new TerraformInfrastructureCostResourceRow("data", "aws_s3_bucket", "us-east-1"),
        ]);

        InfrastructureMonthlyUsdCostEstimator estimator = new(null);
        InfrastructureCostEstimateTotals totals = await estimator.EstimateNodesAsync(
            nodes,
            attemptRetailPricing: false,
            retailPrices: null,
            CancellationToken.None);

        totals.Lines.Should().HaveCount(2);
        totals.Lines.Should().OnlyContain(line => line.AzureProductLabel.StartsWith("Amazon", StringComparison.Ordinal));
        totals.Lines.Should().OnlyContain(line => line.PriceSource == InfrastructureCostPriceSource.Estimated);
        totals.TotalUsdPerMonth.Should().Be(116m);
    }

    [Fact]
    public async Task EstimateNodesAsync_gcp_terraform_rows_use_gcp_product_labels()
    {
        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromTerraformResourceRows([
            new TerraformInfrastructureCostResourceRow("app", "google_compute_instance", "us-central1"),
            new TerraformInfrastructureCostResourceRow("db", "google_sql_database_instance", "us-central1"),
        ]);

        InfrastructureMonthlyUsdCostEstimator estimator = new(null);
        InfrastructureCostEstimateTotals totals = await estimator.EstimateNodesAsync(
            nodes,
            attemptRetailPricing: false,
            retailPrices: null,
            CancellationToken.None);

        totals.Lines.Should().HaveCount(2);
        totals.Lines.Should().OnlyContain(line =>
            line.AzureProductLabel.StartsWith("Google", StringComparison.Ordinal));
        totals.TotalUsdPerMonth.Should().Be(121m);
    }

    [Theory]
    [InlineData(RuntimePlatform.Ec2, "Amazon EC2")]
    [InlineData(RuntimePlatform.Gke, "Google Kubernetes Engine")]
    [InlineData(RuntimePlatform.AppService, "Azure App Service")]
    public void FormatIllustrativeProduct_returns_cloud_aware_labels(RuntimePlatform platform, string expected) =>
        IllustrativeInfrastructureCostFallback.FormatIllustrativeProduct(platform).Should().Be(expected);

    [Fact]
    public async Task EstimateNodesAsync_aws_inventory_rows_use_aws_product_labels()
    {
        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromAwsExtractorInventory([
            new AzureExtractorInventoryResourceLine("web", "AWS::EC2::Instance", "us-east-1", "t3.micro"),
        ]);

        InfrastructureMonthlyUsdCostEstimator estimator = new(null);
        InfrastructureCostEstimateTotals totals = await estimator.EstimateNodesAsync(
            nodes,
            attemptRetailPricing: false,
            retailPrices: null,
            CancellationToken.None);

        totals.Lines.Should().ContainSingle();
        totals.Lines[0].AzureProductLabel.Should().StartWith("Amazon");
    }

    [Fact]
    public async Task EstimateNodesAsync_gcp_inventory_rows_use_gcp_product_labels()
    {
        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromGcpExtractorInventory([
            new AzureExtractorInventoryResourceLine(
                "vm",
                "compute.googleapis.com/Instance",
                "us-central1",
                "e2-medium"),
        ]);

        InfrastructureMonthlyUsdCostEstimator estimator = new(null);
        InfrastructureCostEstimateTotals totals = await estimator.EstimateNodesAsync(
            nodes,
            attemptRetailPricing: false,
            retailPrices: null,
            CancellationToken.None);

        totals.Lines.Should().ContainSingle();
        totals.Lines[0].AzureProductLabel.Should().StartWith("Google");
    }
}
