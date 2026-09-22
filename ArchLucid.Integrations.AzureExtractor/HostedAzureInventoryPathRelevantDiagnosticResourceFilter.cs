using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Limits hosted diagnostic-setting GET fan-out to path-relevant resource types (AX-DE-10).
/// </summary>
internal static class HostedAzureInventoryPathRelevantDiagnosticResourceFilter
{
    public static bool IsPathRelevant(string resourceType) =>
        AzureInventoryPathRelevantDiagnosticResourceCatalog.IsPathRelevant(resourceType);
}
