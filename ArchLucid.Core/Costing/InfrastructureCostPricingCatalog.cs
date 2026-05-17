using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>
///     Maps logical <see cref="RuntimePlatform" /> values to Azure Retail Prices <c>serviceName</c> strings.
/// </summary>
public static class InfrastructureCostPricingCatalog
{
    /// <summary>Returns <see langword="true"/> when a retail lookup is plausible for this platform.</summary>
    public static bool TryGetRetailServiceName(RuntimePlatform platform, out string retailServiceName)
    {
        switch (platform)
        {
            case RuntimePlatform.Vm:
                retailServiceName = "Virtual Machines";

                return true;

            case RuntimePlatform.SqlServer:
                retailServiceName = "Azure SQL Database";

                return true;

            case RuntimePlatform.Redis:
                retailServiceName = "Azure Cache for Redis";

                return true;

            case RuntimePlatform.BlobStorage:
                retailServiceName = "Storage Accounts";

                return true;

            case RuntimePlatform.AzureAiSearch:
                retailServiceName = "Azure Cognitive Search";

                return true;

            case RuntimePlatform.AzureOpenAi:
                retailServiceName = "Cognitive Services";

                return true;

            default:

                retailServiceName = string.Empty;

                return false;
        }
    }
}
