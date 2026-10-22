namespace ArchLucid.Core.AzureExtractor;

/// <summary>Parsed endpoint pair for <c>Microsoft.Network/connections</c> (NR-01).</summary>
public sealed class AzureInventoryNetworkConnectionEndpointParseResult
{
    public string? ConnectionType
    {
        get;
        init;
    }

    public string? Endpoint1ArmId
    {
        get;
        init;
    }

    public string? Endpoint2ArmId
    {
        get;
        init;
    }

    public bool HasBothEndpoints =>
        !string.IsNullOrWhiteSpace(Endpoint1ArmId) && !string.IsNullOrWhiteSpace(Endpoint2ArmId);
}
