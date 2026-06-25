using ArchLucid.Contracts.Common;
using ArchLucid.Core.Costing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Costing;

[Trait("Category", "Unit")]
public sealed class TerraformResourceCostMapperTests
{
    [Theory]
    [InlineData("aws_instance", RuntimePlatform.Ec2)]
    [InlineData("hashicorp/aws/aws_instance", RuntimePlatform.Ec2)]
    [InlineData("aws_lambda_function", RuntimePlatform.Lambda)]
    [InlineData("aws_eks_cluster", RuntimePlatform.Eks)]
    [InlineData("aws_db_instance", RuntimePlatform.Rds)]
    [InlineData("aws_s3_bucket", RuntimePlatform.S3)]
    [InlineData("google_compute_instance", RuntimePlatform.ComputeEngine)]
    [InlineData("google_container_cluster", RuntimePlatform.Gke)]
    [InlineData("google_sql_database_instance", RuntimePlatform.CloudSql)]
    [InlineData("google_storage_bucket", RuntimePlatform.Gcs)]
    public void TryInferPlatformFromTerraformType_maps_common_multi_cloud_resources(string terraformType, RuntimePlatform expected)
    {
        bool mapped = TerraformResourceCostMapper.TryInferPlatformFromTerraformType(terraformType, out RuntimePlatform platform);

        mapped.Should().BeTrue();
        platform.Should().Be(expected);
    }

    [Fact]
    public void TryInferPlatformFromTerraformType_returns_false_for_unknown_types()
    {
        bool mapped = TerraformResourceCostMapper.TryInferPlatformFromTerraformType("azurerm_resource_group", out _);

        mapped.Should().BeFalse();
    }
}
