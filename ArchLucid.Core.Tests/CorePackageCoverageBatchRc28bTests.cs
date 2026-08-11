using ArchLucid.Contracts.Common;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Costing;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Scim.Filtering;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Security;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests;

/// <summary>
///     RC28b package-coverage batch: config-key requirement matrix, cloud cost mappers, SCIM filter evaluation,
///     and outbound HTTPS URL pre-DNS guards.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc28bTests
{
    [Theory]
    [InlineData(ConfigKeyRequirementKind.WhenApiKeyEnabled, "Authentication:ApiKey:Enabled", "true", true)]
    [InlineData(ConfigKeyRequirementKind.WhenApiKeyEnabled, "Authentication:ApiKey:Enabled", "false", false)]
    [InlineData(ConfigKeyRequirementKind.WhenOtlpEnabled, "Observability:Otlp:Enabled", "true", true)]
    [InlineData(ConfigKeyRequirementKind.WhenWorkerRole, "Hosting:Role", "Worker", true)]
    [InlineData(ConfigKeyRequirementKind.WhenWorkerRole, "Hosting:Role", "Api", false)]
    public void ConfigurationKeyRequirement_IsKeyRequired_by_kind(
        ConfigKeyRequirementKind kind,
        string key,
        string value,
        bool expected)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { [key] = value })
            .Build();
        ConfigurationKeyEntry entry = new(
            "s",
            "path",
            ["env"],
            null,
            "req",
            "desc",
            kind);

        bool required = ConfigurationKeyRequirement.IsKeyRequired(entry, configuration, aspNetCoreEnvironment: "Development", out string reason);

        required.Should().Be(expected);

        if (expected)
            reason.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void ConfigurationKeyRequirement_WhenDefaultSqlStorage_and_WhenRealLlmNotEcho()
    {
        IConfiguration sql = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ArchLucid:StorageProvider"] = "Sql" })
            .Build();
        ConfigurationKeyEntry sqlEntry = new("s", "p", ["e"], null, "r", "d", ConfigKeyRequirementKind.WhenDefaultSqlStorage);
        ConfigurationKeyRequirement.IsKeyRequired(sqlEntry, sql, "Development").Should().BeTrue();

        IConfiguration cosmos = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["ArchLucid:StorageProvider"] = "Cosmos" })
            .Build();
        ConfigurationKeyRequirement.IsKeyRequired(sqlEntry, cosmos, "Development").Should().BeFalse();

        IConfiguration realLlm = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Real",
                    ["AgentExecution:CompletionClient"] = "AzureOpenAi",
                })
            .Build();
        ConfigurationKeyEntry llmEntry = new("s", "p", ["e"], null, "r", "d", ConfigKeyRequirementKind.WhenRealLlmNotEcho);
        ConfigurationKeyRequirement.IsKeyRequired(llmEntry, realLlm, "Development", out string reason).Should().BeTrue();
        reason.Should().Contain("Real");

        IConfiguration echo = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Real",
                    ["AgentExecution:CompletionClient"] = "Echo",
                })
            .Build();
        ConfigurationKeyRequirement.IsKeyRequired(llmEntry, echo, "Development").Should().BeFalse();
    }

    [Fact]
    public void ConfigurationKeyRequirement_WhenProduction_and_WhenAcsEmail_and_None()
    {
        IConfiguration empty = new ConfigurationBuilder().AddInMemoryCollection().Build();
        ConfigurationKeyEntry prod = new("s", "p", ["e"], null, "r", "d", ConfigKeyRequirementKind.WhenProduction);
        ConfigurationKeyRequirement.IsKeyRequired(prod, empty, "Production").Should().BeTrue();
        ConfigurationKeyRequirement.IsKeyRequired(prod, empty, "Development").Should().BeFalse();

        IConfiguration acs = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Email:Provider"] = EmailProviderNames.AzureCommunicationServices })
            .Build();
        ConfigurationKeyEntry acsEntry = new("s", "p", ["e"], null, "r", "d", ConfigKeyRequirementKind.WhenAcsEmail);
        ConfigurationKeyRequirement.IsKeyRequired(acsEntry, acs, "Development").Should().BeTrue();

        ConfigurationKeyEntry none = new("s", "p", ["e"], null, "r", "d", ConfigKeyRequirementKind.None);
        ConfigurationKeyRequirement.IsKeyRequired(none, empty, "Production", out string reason).Should().BeFalse();
        reason.Should().BeEmpty();
    }

    [Theory]
    [InlineData("AWS::EC2::Instance", RuntimePlatform.Ec2)]
    [InlineData("AWS::Lambda::Function", RuntimePlatform.Lambda)]
    [InlineData("AWS::EKS::Cluster", RuntimePlatform.Eks)]
    [InlineData("AWS::RDS::DBInstance", RuntimePlatform.Rds)]
    [InlineData("AWS::S3::Bucket", RuntimePlatform.S3)]
    [InlineData("AWS::ElastiCache::CacheCluster", RuntimePlatform.ElastiCache)]
    [InlineData("unknown", null)]
    [InlineData(null, null)]
    public void AwsInventoryResourceCostMapper_TryInferPlatform(string? resourceType, RuntimePlatform? expected)
    {
        AwsInventoryResourceCostMapper.TryInferPlatform(resourceType).Should().Be(expected);
    }

    [Theory]
    [InlineData("aws_instance", RuntimePlatform.Ec2)]
    [InlineData("aws_lambda_function", RuntimePlatform.Lambda)]
    [InlineData("aws_eks_cluster", RuntimePlatform.Eks)]
    [InlineData("aws_db_instance", RuntimePlatform.Rds)]
    [InlineData("aws_rds_cluster", RuntimePlatform.Rds)]
    [InlineData("aws_s3_bucket", RuntimePlatform.S3)]
    [InlineData("aws_elasticache_cluster", RuntimePlatform.ElastiCache)]
    [InlineData("aws_elasticache_replication_group", RuntimePlatform.ElastiCache)]
    [InlineData("aws_unknown", null)]
    [InlineData("  ", null)]
    public void AwsResourceCostMapper_TryInferPlatformFromTerraformType(string? terraformType, RuntimePlatform? expected)
    {
        AwsResourceCostMapper.TryInferPlatformFromTerraformType(terraformType).Should().Be(expected);
    }

    [Theory]
    [InlineData("google_compute_instance", RuntimePlatform.ComputeEngine)]
    [InlineData("google_container_cluster", RuntimePlatform.Gke)]
    [InlineData("google_sql_database_instance", RuntimePlatform.CloudSql)]
    [InlineData("google_storage_bucket", RuntimePlatform.Gcs)]
    [InlineData("google_unknown", null)]
    public void GcpResourceCostMapper_TryInferPlatformFromTerraformType(string? terraformType, RuntimePlatform? expected)
    {
        GcpResourceCostMapper.TryInferPlatformFromTerraformType(terraformType).Should().Be(expected);
    }

    [Theory]
    [InlineData("//compute.googleapis.com/Instance", RuntimePlatform.ComputeEngine)]
    [InlineData("//container.googleapis.com/Cluster", RuntimePlatform.Gke)]
    [InlineData("//sqladmin.googleapis.com/Instance", RuntimePlatform.CloudSql)]
    [InlineData("//storage.googleapis.com/Bucket", RuntimePlatform.Gcs)]
    [InlineData("other", null)]
    public void GcpInventoryResourceCostMapper_TryInferPlatform(string? resourceType, RuntimePlatform? expected)
    {
        GcpInventoryResourceCostMapper.TryInferPlatform(resourceType).Should().Be(expected);
    }

    [Theory]
    [InlineData("Microsoft.Compute/virtualMachines", RuntimePlatform.Vm)]
    [InlineData("Microsoft.Web/sites", RuntimePlatform.AppService)]
    [InlineData("Microsoft.Web/serverFarms", RuntimePlatform.AppService)]
    [InlineData("Microsoft.ContainerService/managedClusters", RuntimePlatform.Aks)]
    [InlineData("Microsoft.Sql/servers/databases", RuntimePlatform.SqlServer)]
    [InlineData("Microsoft.Sql/managedInstances", RuntimePlatform.SqlServer)]
    [InlineData("Microsoft.Storage/storageAccounts", RuntimePlatform.BlobStorage)]
    [InlineData("Microsoft.Cache/redis", RuntimePlatform.Redis)]
    [InlineData("Microsoft.KeyVault/vaults", RuntimePlatform.KeyVault)]
    [InlineData("Microsoft.Search/searchServices", RuntimePlatform.AzureAiSearch)]
    [InlineData("Microsoft.CognitiveServices/accounts", RuntimePlatform.AzureOpenAi)]
    [InlineData("microsoft.insights/components", null)]
    [InlineData("Microsoft.Unknown/type", null)]
    public void AzureArmResourceCostMapper_TryInferPlatform(string? armType, RuntimePlatform? expected)
    {
        AzureArmResourceCostMapper.TryInferPlatform(armType).Should().Be(expected);
    }

    [Fact]
    public void ScimFilterInMemoryEvaluator_matches_null_filter_and_comparison_operators()
    {
        ScimUserRecord user = new()
        {
            UserName = "alice@example.com",
            DisplayName = "Alice",
            ExternalId = "ext-1",
        };

        ScimFilterInMemoryEvaluator.Matches(user, null).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("userName", "eq", "alice@example.com")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("userName", "ne", "bob")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("displayName", "co", "lic")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("displayName", "sw", "Al")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("displayName", "ew", "ce")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("externalId", "gt", "ext-0")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("externalId", "lt", "ext-9")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("externalId", "ge", "ext-1")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimComparisonNode("externalId", "le", "ext-1")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimPresentNode("userName")).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(user, new ScimNotNode(new ScimComparisonNode("userName", "eq", "bob"))).Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(
                user,
                new ScimAndNode(
                    new ScimComparisonNode("userName", "eq", "alice@example.com"),
                    new ScimPresentNode("displayName")))
            .Should().BeTrue();
        ScimFilterInMemoryEvaluator.Matches(
                user,
                new ScimOrNode(
                    new ScimComparisonNode("userName", "eq", "bob"),
                    new ScimComparisonNode("displayName", "eq", "Alice")))
            .Should().BeTrue();
    }

    [Fact]
    public async Task OutboundHttpsUrlDnsResolutionGuard_rejects_before_dns()
    {
        (await OutboundHttpsUrlDnsResolutionGuard.TryGetRejectionReasonAfterDnsResolveAsync("")).Should().Contain("required");
        (await OutboundHttpsUrlDnsResolutionGuard.TryGetRejectionReasonAfterDnsResolveAsync("not-a-url")).Should().Contain("absolute");
        (await OutboundHttpsUrlDnsResolutionGuard.TryGetRejectionReasonAfterDnsResolveAsync("http://example.com")).Should().Contain("https");
        (await OutboundHttpsUrlDnsResolutionGuard.TryGetRejectionReasonAfterDnsResolveAsync("https://localhost/x")).Should()
            .Contain("private");
        (await OutboundHttpsUrlDnsResolutionGuard.TryGetRejectionReasonAfterDnsResolveAsync("https://127.0.0.1/x")).Should()
            .Contain("private");
    }
}
