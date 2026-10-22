namespace ArchLucid.Core.AzureExtractor;

/// <summary>Canonical inventory diagram relationship labels (NR-21 through NR-28).</summary>
public static class InventoryDiagramRelationshipLabelTexts
{
    public const string HasAccess = "Has access";

    public const string PrivateAccess = "Private access";

    public const string PublicExposureCaption = "Public IP is attached; its card is hidden on this diagram.";

    public const string Peered = "Peered";

    public const string SendsTrafficTo = "Sends traffic to";

    public const string BackendPoolNames = "Backend pool names";

    public static string FormatRoutedThrough(string nextHopResourceName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextHopResourceName);

        return $"Routed through {nextHopResourceName.Trim()}";
    }

    public static string FormatSendsTrafficTo(int? backendPort)
    {
        if (backendPort is null)
        {
            return SendsTrafficTo;
        }

        return $"{SendsTrafficTo} {backendPort.Value}";
    }

    public static string FormatBackendPoolNames(int? backendPort)
    {
        if (backendPort is null)
        {
            return BackendPoolNames;
        }

        return $"{BackendPoolNames} port {backendPort.Value}";
    }

    public static string FormatPeeringNotConnected(string remoteVirtualNetworkName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(remoteVirtualNetworkName);

        return $"Peering to {remoteVirtualNetworkName.Trim()} is not connected";
    }
}
