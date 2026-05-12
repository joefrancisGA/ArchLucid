using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MockAzureMonthlyCostEstimatorTests
{
    [Theory]
    [InlineData(RuntimePlatform.Unknown, 25)]
    [InlineData(RuntimePlatform.AppService, 45)]
    [InlineData(RuntimePlatform.Functions, 25)]
    [InlineData(RuntimePlatform.Aks, 350)]
    [InlineData(RuntimePlatform.Vm, 120)]
    [InlineData(RuntimePlatform.ContainerApps, 55)]
    [InlineData(RuntimePlatform.SqlServer, 15)]
    [InlineData(RuntimePlatform.AzureAiSearch, 250)]
    [InlineData(RuntimePlatform.AzureOpenAi, 200)]
    [InlineData(RuntimePlatform.Redis, 40)]
    [InlineData(RuntimePlatform.BlobStorage, 8)]
    [InlineData(RuntimePlatform.KeyVault, 5)]
    public void Estimate_matches_mock_table(RuntimePlatform platform, decimal expectedUsd)
    {
        MockAzureMonthlyCostEstimator.EstimateUsdPerMonth(platform).Should().Be(expectedUsd);
    }

    [Theory]
    [InlineData(RuntimePlatform.AppService, "Azure App Service")]
    [InlineData(RuntimePlatform.SqlServer, "Azure SQL")]
    [InlineData(RuntimePlatform.Unknown, "Azure (unspecified)")]
    public void FormatIllustrativeAzureProduct_matches_contract(RuntimePlatform platform, string expected)
    {
        MockAzureMonthlyCostEstimator.FormatIllustrativeAzureProduct(platform).Should().Be(expected);
    }
}