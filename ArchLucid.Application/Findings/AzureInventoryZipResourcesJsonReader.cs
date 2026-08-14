namespace ArchLucid.Application.Findings;

/// <summary>Reads <c>resources.json</c> from a scoped Azure extractor ZIP package.</summary>
internal static class AzureInventoryZipResourcesJsonReader
{
    public static string? TryReadResourcesJson(byte[] packageBytes)
    {
        return AzureInventoryZipJsonEntryReader.TryReadEntry(packageBytes, "resources.json");
    }
}
