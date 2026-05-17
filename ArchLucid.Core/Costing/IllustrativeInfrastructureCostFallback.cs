using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>
///     Hard-coded illustrative USD/month figures per <see cref="RuntimePlatform" /> — used when live Retail API pricing is off or mismatched.
/// </summary>
public static class IllustrativeInfrastructureCostFallback
{
    internal static bool TryGetIllustrativeMonthlyUsd(RuntimePlatform platform, out decimal usdPerMonth)
    {
        usdPerMonth = platform switch
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

        return true;
    }

    /// <summary>Human-facing Azure service name for tables.</summary>
    public static string FormatIllustrativeAzureProduct(RuntimePlatform platform)
    {
        return platform switch
        {
            RuntimePlatform.Unknown => "Azure (unspecified)",
            RuntimePlatform.AppService => "Azure App Service",
            RuntimePlatform.Functions => "Azure Functions",
            RuntimePlatform.Aks => "Azure Kubernetes Service",
            RuntimePlatform.Vm => "Azure Virtual Machines",
            RuntimePlatform.ContainerApps => "Azure Container Apps",
            RuntimePlatform.SqlServer => "Azure SQL",
            RuntimePlatform.AzureAiSearch => "Azure AI Search",
            RuntimePlatform.AzureOpenAi => "Azure OpenAI Service",
            RuntimePlatform.Redis => "Azure Cache for Redis",
            RuntimePlatform.BlobStorage => "Azure Blob Storage",
            RuntimePlatform.KeyVault => "Azure Key Vault",
            _ => "Azure workload",
        };
    }

    internal static InfrastructureCostLine ToFallbackLine(InfrastructureCostQueryNode node)
    {
        IllustrativeInfrastructureCostFallback.TryGetIllustrativeMonthlyUsd(node.Platform, out decimal usd);
        decimal total = ScaleByQuantity(usd, node.Quantity);

        return new InfrastructureCostLine(
            node.LineKind,
            node.DisplayName,
            node.Platform,
            FormatIllustrativeAzureProduct(node.Platform),
            Math.Round(total, 2),
            InfrastructureCostPriceSource.Estimated);
    }

    private static decimal ScaleByQuantity(decimal unitUsd, int quantity)
    {
        int q = quantity < 1 ? 1 : quantity;

        return decimal.Multiply(unitUsd, q);
    }
}
