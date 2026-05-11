using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Hard-coded illustrative USD/month figures per <see cref="RuntimePlatform" /> for CLI UX only (not Azure Pricing API).
/// </summary>
internal static class MockAzureMonthlyCostEstimator
{
    internal static decimal EstimateUsdPerMonth(RuntimePlatform platform)
    {
        return platform switch
        {
            RuntimePlatform.Unknown => 25m,
            RuntimePlatform.AppService => 45m,
            RuntimePlatform.Functions => 25m,
            RuntimePlatform.Aks => 350m,
            RuntimePlatform.Vm => 120m,
            RuntimePlatform.ContainerApps => 55m,
            RuntimePlatform.SqlServer => 15m,
            RuntimePlatform.AzureAiSearch => 250m,
            RuntimePlatform.AzureOpenAi => 200m,
            RuntimePlatform.Redis => 40m,
            RuntimePlatform.BlobStorage => 8m,
            RuntimePlatform.KeyVault => 5m,
            _ => 25m,
        };
    }
}
