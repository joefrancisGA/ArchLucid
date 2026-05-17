using ArchLucid.Core.Costing;

using FluentAssertions;

using Contracts = ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class IllustrativeInfrastructureCostFallbackTests
{
    [Theory]
    [InlineData(Contracts.RuntimePlatform.Unknown, 25)]
    [InlineData(Contracts.RuntimePlatform.AppService, 45)]
    [InlineData(Contracts.RuntimePlatform.Functions, 25)]
    [InlineData(Contracts.RuntimePlatform.Aks, 350)]
    [InlineData(Contracts.RuntimePlatform.Vm, 120)]
    [InlineData(Contracts.RuntimePlatform.ContainerApps, 55)]
    [InlineData(Contracts.RuntimePlatform.SqlServer, 15)]
    [InlineData(Contracts.RuntimePlatform.AzureAiSearch, 250)]
    [InlineData(Contracts.RuntimePlatform.AzureOpenAi, 200)]
    [InlineData(Contracts.RuntimePlatform.Redis, 40)]
    [InlineData(Contracts.RuntimePlatform.BlobStorage, 8)]
    [InlineData(Contracts.RuntimePlatform.KeyVault, 5)]
    public void EstimateIllustrativeMonthlyUsd_matches_lookup_table(
        Contracts.RuntimePlatform platform,

        decimal expectedUsd)


        =>
            IllustrativeInfrastructureCostFallback.EstimateIllustrativeMonthlyUsd(platform).Should().Be(expectedUsd);


    [Theory]


    [InlineData(Contracts.RuntimePlatform.AppService, "Azure App Service")]

    [InlineData(Contracts.RuntimePlatform.SqlServer, "Azure SQL")]

    [InlineData(Contracts.RuntimePlatform.Unknown, "Azure (unspecified)")]



    public void FormatIllustrativeAzureProduct_matches_contract(Contracts.RuntimePlatform platform, string expected)


        =>


            IllustrativeInfrastructureCostFallback.FormatIllustrativeAzureProduct(platform)

                .

                Should().Be(expected);


}


