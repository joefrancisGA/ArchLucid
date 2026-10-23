namespace ArchLucid.Core.AzureExtractor;

/// <summary>Canonical inventory diagram relationship labels (NR-21 through NR-28).</summary>
public static class InventoryDiagramRelationshipLabelTexts
{
    public const string HasAccess = "Has access";

    public const string PrivateAccess = "Private endpoint. This is not observed traffic.";

    public const string PublicExposureCaption = "Public IP is attached; its card is hidden on this diagram.";

    public const string PublicIpAddressNotStored = "Public IP address was not stored.";

    public const string PrivateEndpointConnectionStatusNotStored =
        "Private endpoint connection status was not stored.";

    public static string FormatHiddenPublicIpCaption(string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(ipAddress))
        {
            return $"{PublicExposureCaption} {PublicIpAddressNotStored}";
        }

        return $"{PublicExposureCaption} {ipAddress.Trim()}";
    }

    public static string FormatPrivateEndpointConnectionLabel(string? connectionStatus)
    {
        if (string.IsNullOrWhiteSpace(connectionStatus))
        {
            return PrivateEndpointConnectionStatusNotStored;
        }

        string status = connectionStatus.Trim();

        if (status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
        {
            return "Private endpoint connection: Approved.";
        }

        if (status.Equals("Rejected", StringComparison.OrdinalIgnoreCase)
            || status.Equals("Disconnected", StringComparison.OrdinalIgnoreCase)
            || status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
        {
            return $"Private endpoint connection: {status}";
        }

        return $"Private endpoint connection: {status}";
    }

    public const string Peered = "Peered";

    public const string SendsTrafficTo = "Sends traffic to";

    public const string BackendPoolNames = "Backend pool names";

    public static string FormatRoutedThrough(string nextHopResourceName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextHopResourceName);

        return $"Default route next hop is {nextHopResourceName.Trim()}. This is not observed traffic.";
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

    public static string FormatPeeringStateNotStored(string remoteVirtualNetworkName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(remoteVirtualNetworkName);

        return $"Peering state was not stored for {remoteVirtualNetworkName.Trim()}.";
    }

    public static string FormatPeeringConnectedOffCanvas(string remoteVirtualNetworkName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(remoteVirtualNetworkName);

        return $"Peering to {remoteVirtualNetworkName.Trim()} is connected. The remote network is not on this diagram.";
    }

    public static string FormatSendsTrafficToBackend(int? backendPort)
    {
        return backendPort is null
            ? "Sends traffic to this backend. Backend port was not stored."
            : $"Sends traffic to this backend on port {backendPort.Value}.";
    }

    public static string FormatBackendOffCanvasOutline(string backendName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(backendName);

        return $"Backend {backendName.Trim()} is not on this diagram.";
    }
}
