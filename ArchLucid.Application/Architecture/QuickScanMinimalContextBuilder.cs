using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Architecture;

/// <summary>Builds a single synthetic file payload for <see cref="IQuickScanService" /> from minimal API input.</summary>
public static class QuickScanMinimalContextBuilder
{
    /// <summary>Produces path → text entries consumed by the quick-scan LLM prompt.</summary>
    public static Dictionary<string, string> BuildFiles(ArchitectureQuickScanRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        string systemName = (request.SystemName).Trim();
        string cloud = (request.CloudProvider).Trim();
        string description = (request.Description).Trim();

        string cloudLine = string.IsNullOrEmpty(cloud) ? "Unspecified" : cloud;
        string body =
            "SystemName: "
            + systemName
            + "\nCloudProvider: "
            + cloudLine
            + "\nDescription:\n"
            + description;

        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["quick-scan-context.txt"] = body
        };
    }
}
