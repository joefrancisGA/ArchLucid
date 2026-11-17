namespace ArchLucid.Core.AzureExtractor;

/// <summary>Graph edge properties for redacted Log Analytics dependency observations (SN-RT-06/07).</summary>
public static class AzureInventoryObservedDependencyEdgePropertyKeys
{
    public const string WindowStartUtc = "observed.windowStartUtc";

    public const string WindowEndUtc = "observed.windowEndUtc";
}
