using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
///     RC28 package-coverage batch: chunking strategy fingerprints and Azure retail-price heuristic branches.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc28Tests
{
    [Theory]
    [InlineData(CorpusKind.PolicyPack)]
    [InlineData(CorpusKind.PriorManifest)]
    [InlineData(CorpusKind.Conversation)]
    [InlineData(CorpusKind.TenantManifest)]
    [InlineData(CorpusKind.PlatformDoc)]
    [InlineData(CorpusKind.ReferenceArchitecture)]
    [InlineData(CorpusKind.AzureRetailPrice)]
    [InlineData(CorpusKind.KnowledgeGraphNode)]
    public void ChunkingStrategyFingerprint_Compute_is_stable_hex_for_all_corpus_kinds(CorpusKind corpusKind)
    {
        string first = ChunkingStrategyFingerprint.Compute(corpusKind);
        string second = ChunkingStrategyFingerprint.Compute(corpusKind);

        first.Should().HaveLength(64);
        first.Should().MatchRegex("^[0-9A-F]+$");
        first.Should().Be(second);
    }

    [Fact]
    public void ChunkingStrategyFingerprint_Compute_differs_for_policy_vs_default()
    {
        string policy = ChunkingStrategyFingerprint.Compute(CorpusKind.PolicyPack);
        string prior = ChunkingStrategyFingerprint.Compute(CorpusKind.PriorManifest);
        string simple = ChunkingStrategyFingerprint.Compute(CorpusKind.Conversation);

        policy.Should().NotBe(prior);
        policy.Should().NotBe(simple);
        prior.Should().NotBe(simple);
    }

    [Theory]
    [InlineData("Virtual Machines", "Standard_D2s_v5", 70)]
    [InlineData("Virtual Machines", "Standard_D4s_v5", 140)]
    [InlineData("Virtual Machines", "Standard_E2s_v5", 95)]
    [InlineData("Virtual Machines", "Standard_B2s", 35)]
    [InlineData("Disks", "P10", 20)]
    [InlineData("Disks", "P30", 80)]
    [InlineData("Virtual Machines", "Standard_D16s_v5", 70)]
    [InlineData("Virtual Machines", "Standard_E32s_v5", 95)]
    [InlineData("Managed Disks", "P40", 25)]
    public void AzureRetailPricesHeuristicFallback_estimates_known_compute_and_disk_skus(
        string serviceName,
        string sku,
        int expectedMonthlyUsd)
    {
        bool resolved = AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, sku, out decimal monthlyUsd);

        resolved.Should().BeTrue();
        monthlyUsd.Should().Be(expectedMonthlyUsd);
    }

    [Theory]
    [InlineData("Azure App Service", "S1", 75)]
    [InlineData("App Service", "S2", 150)]
    [InlineData("App Service", "S3", 300)]
    [InlineData("App Service", "S9", 75)]
    [InlineData("App Service", "P1v3", 150)]
    [InlineData("App Service", "P2v2", 300)]
    public void AzureRetailPricesHeuristicFallback_estimates_app_service_skus(
        string serviceName,
        string sku,
        int expectedMonthlyUsd)
    {
        bool resolved = AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, sku, out decimal monthlyUsd);

        resolved.Should().BeTrue();
        monthlyUsd.Should().Be(expectedMonthlyUsd);
    }

    [Theory]
    [InlineData("Azure SQL Database", "BC_Gen5_2", 300)]
    [InlineData("SQL Database", "S0", 15)]
    [InlineData("SQL Database", "S1", 50)]
    [InlineData("Azure SQL", "GP_Gen5_4", 200)]
    [InlineData("Azure SQL", "HS_Gen5_8", 200)]
    public void AzureRetailPricesHeuristicFallback_estimates_sql_skus(
        string serviceName,
        string sku,
        int expectedMonthlyUsd)
    {
        bool resolved = AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, sku, out decimal monthlyUsd);

        resolved.Should().BeTrue();
        monthlyUsd.Should().Be(expectedMonthlyUsd);
    }

    [Theory]
    [InlineData("Azure Cache for Redis", "C0", 50)]
    [InlineData("Redis Cache", "C1", 150)]
    [InlineData("Redis", "P1", 150)]
    [InlineData("Redis", "C3", 200)]
    public void AzureRetailPricesHeuristicFallback_estimates_redis_skus(
        string serviceName,
        string sku,
        int expectedMonthlyUsd)
    {
        bool resolved = AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, sku, out decimal monthlyUsd);

        resolved.Should().BeTrue();
        monthlyUsd.Should().Be(expectedMonthlyUsd);
    }

    [Theory]
    [InlineData("Storage", "Hot_LRS", 20)]
    [InlineData("Blob Storage", "Cool_ZRS", 20)]
    [InlineData("Storage Accounts", "Standard_GRS", 20)]
    public void AzureRetailPricesHeuristicFallback_estimates_storage_redundancy_skus(
        string serviceName,
        string sku,
        int expectedMonthlyUsd)
    {
        bool resolved = AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, sku, out decimal monthlyUsd);

        resolved.Should().BeTrue();
        monthlyUsd.Should().Be(expectedMonthlyUsd);
    }

    [Theory]
    [InlineData("Virtual Machines", "Standard_X99")]
    [InlineData("Unknown Service", "S1")]
    [InlineData("Storage", "Premium_SSD")]
    public void AzureRetailPricesHeuristicFallback_declines_unknown_combinations(string serviceName, string sku)
    {
        bool resolved = AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd(serviceName, sku, out decimal monthlyUsd);

        resolved.Should().BeFalse();
        monthlyUsd.Should().Be(0m);
    }

    [Fact]
    public void AzureRetailPricesHeuristicFallback_rejects_blank_arguments()
    {
        FluentActions
            .Invoking(() => AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd("  ", "S1", out _))
            .Should()
            .Throw<ArgumentException>();

        FluentActions
            .Invoking(() => AzureRetailPricesHeuristicFallback.TryGetMonthlyUsd("App Service", "  ", out _))
            .Should()
            .Throw<ArgumentException>();
    }
}
