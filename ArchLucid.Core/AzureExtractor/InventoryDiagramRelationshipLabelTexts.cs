namespace ArchLucid.Core.AzureExtractor;

/// <summary>Canonical inventory diagram relationship labels (NR-21 through NR-28).</summary>
public static class InventoryDiagramRelationshipLabelTexts
{
    public const string HasAccess = "Has access";

    public const string PrivateAccess = "Private endpoint. This is not observed traffic.";

    public const string ServiceConnectorConfiguredLabel =
        "Service connector is configured. An observed connection was not stored.";

    public const string AppAuthorizedAccessLabel =
        "Authorization may allow access. Observed use was not stored.";

    public const string AppToKeyVaultRefLabel =
        "App setting names Key Vault. Observed secret access was not stored.";

    public const string ConnectionStoredObservedTrafficNotStoredLabel =
        "Connection was stored. Observed traffic was not stored.";

    public const string OperatorConfirmedConnectionLabel =
        "Operator confirmed connection. Observed traffic was not stored.";

    public const string RouteStoredObservedTrafficNotStoredLabel =
        "Route was stored. Observed traffic was not stored.";

    public const string AvdSessionHostStoredObservedSessionNotStoredLabel =
        "AVD session host was stored. An observed session was not stored.";

    public const string MemberOfStoredObservedUseNotStoredLabel =
        "Membership was stored. Observed use of that membership was not stored.";

    public const string DependencyStoredObservedUseNotStoredLabel =
        "Dependency was stored. Observed use was not stored.";

    public const string RelatesToStoredNotSpecificLabel =
        "A relates-to link was stored. A more specific relationship was not stored.";

    public const string SqlPrincipalAuthorizedAccessLabel =
        "SQL principal authorization may allow access. An observed query was not stored.";

    public const string HostnameInferredTargetLabel =
        "App setting hostname was inferred. A stored resource link was not stored.";

    public const string PeReachableTargetInferredLabel =
        "Private endpoint target was inferred. Reachability was not stored.";

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
            return "Private access · Approved";
        }

        if (status.Equals("Rejected", StringComparison.OrdinalIgnoreCase)
            || status.Equals("Disconnected", StringComparison.OrdinalIgnoreCase)
            || status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
        {
            return $"Private endpoint connection: {status}";
        }

        return $"Private endpoint connection: {status}";
    }

    public const string RouteNextHopConfiguredNotObservedLabel =
        "Route next hop is configured. This is not observed traffic.";

    public const string NetworkConnectionConfiguredNotObservedLabel =
        "Network connection is configured. Observed traffic was not stored.";

    public const string PrivateNetworkPathNotObservedLabel =
        "Private network path. This is not observed traffic.";

    public const string Peered = "Peering is connected. Observed traffic was not stored.";

    public const string PeeringRemoteNetworkIdStoredPeeringStateNotStored =
        "A remote network id was stored. Peering state was not stored.";

    public const string ProtectionLinkStoredObservedProtectionNotStored =
        "Protection link was stored. Observed protection was not stored.";

    public const string RoleLinkStoredNameAndUseNotStored =
        "Role link was stored. Role name and use were not stored.";

    public const string AppliesToLinkStoredEnforcementNotObserved =
        "Applies-to link was stored. Enforcement was not observed.";

    public const string SubnetPlacementStoredReachabilityNotObserved =
        "Subnet placement was stored. Reachability was not observed.";

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

    public const string BackendPoolMembershipConfiguredObservedTrafficNotStored =
        "Backend pool membership is configured. Observed traffic was not stored.";

    public const string PipelineDatasetConfiguredReadObservedReadNotStored =
        "Pipeline dataset is configured to read. An observed read was not stored.";

    public const string PipelineDatasetConfiguredWriteObservedWriteNotStored =
        "Pipeline dataset is configured to write. An observed write was not stored.";

    public const string EventSubscriptionNamesDestinationObservedDeliveryNotStored =
        "Event subscription names this destination. Observed delivery was not stored.";

    public const string CaptureConfiguredObservedCaptureNotStored =
        "Capture is configured. Observed capture was not stored.";

    public const string AdfTriggerConfiguredObservedRunNotStored =
        "Trigger is configured. This is not an observed run.";

    public const string AdfIntegrationRuntimeConfiguredObservedRunNotStored =
        "Integration runtime in configuration. This is not an observed run.";

    public const string PipelineLinkedServiceConfiguredObservedRunNotStored =
        "Linked service is configured. This is not an observed run.";

    public static string FormatDiagnosticSettingDestinationLabel(string destinationName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(destinationName);

        return $"Diagnostic setting destination is {destinationName.Trim()}. This is not observed log delivery.";
    }

    public const string PrivateEndpointTargetStoredReachabilityNotObserved =
        "Private endpoint target was stored. Reachability was not observed.";

    public const string PrivateEndpointAccessWasStoredLabel =
        "Private endpoint was inferred. Observed access was not stored.";

    public const string DiagnosticSettingNameNotStoredLogDeliveryNotObserved =
        "Diagnostic setting name was not stored. Log delivery was not observed.";

    public const string DiagnosticSettingNamesNotListedLogDeliveryNotObserved =
        "Diagnostic setting names were not listed on this line. Log delivery was not observed.";

    public const string ImageReferenceStoredImagePullNotObserved =
        "Image reference was stored. An image pull was not observed.";

    public const string AuthorizationMayAllowConsumeObservedMessagingNotStored =
        "Authorization may allow consume. Observed messaging was not stored.";

    public const string AuthorizationMayAllowSendObservedMessagingNotStored =
        "Authorization may allow send. Observed messaging was not stored.";

    public const string AuthorizationMayAllowReceiveObservedMessagingNotStored =
        "Authorization may allow receive. Observed messaging was not stored.";

    public const string LinkedServiceConfiguredObservedRunNotStored =
        "Linked service is configured. An observed run was not stored.";

    public const string ApiConnectionConfiguredObservedCallNotStored =
        "API connection is configured. An observed call was not stored.";

    public const string ServiceBusForwardConfiguredObservedDeliveryNotStored =
        "Forwarding is configured. Observed delivery was not stored.";

    public const string ServiceBusForwardDeadLetterConfiguredObservedDeliveryNotStored =
        "Dead-letter forwarding is configured. Observed delivery was not stored.";

    public const string KubernetesServiceLoadBalancerConfiguredObservedTrafficNotStored =
        "Kubernetes service load balancer is configured. Observed traffic was not stored.";

    public const string NetworkSecurityPerimeterAssociationStoredObservedEnforcementNotStored =
        "Network security perimeter association was stored. Observed enforcement was not stored.";

    public const string RoleAssignmentObservedUseNotStoredSuffix = "Observed use was not stored.";

    public const string DiagnosticSettingStorageNamesNotListedQualifier = "names-not-listed";

    public static string FormatDiagnosticSettingStorageLabel(string? settingName)
    {
        if (string.IsNullOrWhiteSpace(settingName))
        {
            return DiagnosticSettingNameNotStoredLogDeliveryNotObserved;
        }

        if (string.Equals(
                settingName.Trim(),
                DiagnosticSettingStorageNamesNotListedQualifier,
                StringComparison.OrdinalIgnoreCase))
        {
            return DiagnosticSettingNamesNotListedLogDeliveryNotObserved;
        }

        return $"{settingName.Trim()}. Log delivery was not observed.";
    }

    public static string FormatRoleAssignmentAccessLabel(string roleName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(roleName);

        return $"Role assignment: {roleName.Trim()}. {RoleAssignmentObservedUseNotStoredSuffix}";
    }

    public static string FormatBackendPoolMembershipConfigured(int? backendPort)
    {
        if (backendPort is null)
        {
            return BackendPoolMembershipConfiguredObservedTrafficNotStored;
        }

        return $"Backend pool membership is configured on port {backendPort.Value}. Observed traffic was not stored.";
    }

    public static string FormatSendsTrafficToBackend(int? backendPort)
    {
        return backendPort is null
            ? "Configured backend pool member. Backend port was not stored."
            : $"Configured backend pool member on port {backendPort.Value}.";
    }

    public static string FormatBackendOffCanvasOutline(string backendName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(backendName);

        return $"Backend {backendName.Trim()} is not on this diagram.";
    }

    public static string FormatRecoveryServicesReplicatesLabel(string? targetRegion)
    {
        if (string.IsNullOrWhiteSpace(targetRegion))
        {
            return $"{AzureInventoryRecoveryServices.ReplicateEdgeLabel} Replication target region was not stored.";
        }

        return $"{AzureInventoryRecoveryServices.ReplicateEdgeLabel} Replication target region: {targetRegion.Trim()}.";
    }

    public static string FormatRecoveryServicesProtectsLabel() =>
        AzureInventoryRecoveryServices.BackupEdgeLabel;
}
