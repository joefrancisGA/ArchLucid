namespace ArchLucid.Core.Configuration.Summary;

/// <summary>
///     Detects configuration path segments that should be redacted in operator summaries.
/// </summary>
internal static class ConfigurationSensitiveConfigPathMatcher
{
    private static readonly string[] SensitiveSegmentFragments =
    [
        "ConnectionString",
        "Password",
        "Secret",
        "Token",
        "ApiKey",
        "PrivateKey",
    ];

    public static bool IsSensitiveConfigPath(string configPath)
    {
        if (string.IsNullOrWhiteSpace(configPath))
            return false;

        foreach (string segment in configPath.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (IsSensitiveConfigSegment(segment))
                return true;
        }

        return configPath.EndsWith(":Key", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsSensitiveConfigSegment(string segment)
    {
        ReadOnlySpan<char> normalized = segment.AsSpan();

        if (normalized.Equals("Key", StringComparison.OrdinalIgnoreCase))
            return true;

        if (normalized.Equals("PrivateKey", StringComparison.OrdinalIgnoreCase)
            || IsPrivateKeyCredentialSegment(normalized)
            || IsExplicitCredentialConfigSegment(normalized))
            return true;

        foreach (string fragment in SensitiveSegmentFragments)
        {
            if (SegmentContainsSensitiveFragment(normalized, fragment))
                return true;
        }

        return false;
    }

    private static bool SegmentContainsSensitiveFragment(ReadOnlySpan<char> segment, string fragment)
    {
        int index = 0;

        while (index < segment.Length)
        {
            int relativeIndex = segment.Slice(index).IndexOf(fragment.AsSpan(), StringComparison.OrdinalIgnoreCase);

            if (relativeIndex < 0)
                return false;

            index += relativeIndex;

            if (!IsNegatedSensitiveFragment(segment, index, fragment)
                && !IsEmbeddedSensitiveFragment(segment, index))
                return true;

            index++;
        }

        return false;
    }

    private static bool IsExplicitCredentialConfigSegment(ReadOnlySpan<char> segment)
    {
        return segment.Equals("ClientSecret", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PrimaryKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SecondaryKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AccountKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SharedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SecondaryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PrimaryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AccountSharedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("StorageAccountKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("BlobAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FileAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("QueueAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("TableAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DiskAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("WebAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ManageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DfsAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CosmosAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ApiAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DataLakeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ServiceAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EventAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PortalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AdminAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SasAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("BackupAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MasterAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RootAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AccountAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("StorageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("KeyAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DefaultAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("GlobalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SharedKeyAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CustomAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LocalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RemoteAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("TempAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("TemporaryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ExternalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("InternalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PrimaryStorageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SecondaryStorageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RotatedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LegacyAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("StagedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ConnectorAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DeprecatedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FallbackAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("IntegrationAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MigrationAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PartnerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReplicaAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ArchiveAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DisasterRecoveryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReplicationAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AuditAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("AutomationAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("BatchAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("BootstrapAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("BrokerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("BridgeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CacheAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ChannelAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ClientAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ClusterAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CloudAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ComputeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ConfigAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ConnectionAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ContainerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ControlAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CoreAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ContentAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CopyAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CorporateAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CredentialAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CustomerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CrossAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CryptoAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DataAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DatabaseAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DedicatedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DeploymentAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DeveloperAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DeviceAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DirectAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DigitalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DirectoryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DistributedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DocumentAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DomainAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DrillAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DriveAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("DynamicAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EdgeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EmailAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EmbeddedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EmergencyAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EncryptionAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EnterpriseAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EntryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("EnvironmentAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ExchangeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ExecutionAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ExportAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ExtensionAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FederatedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FetchAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FilterAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FinalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FinanceAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FirewallAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FlagAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FleetAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FlowAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FolderAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ForwardAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FoundationAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FrontAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("FullAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("GatewayAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("GroupAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("GuestAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("HandleAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("HashAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("HealthAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("HostAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("HubAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("HybridAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("IdentityAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ImageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ImportAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("IndexAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("InstanceAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("InteractiveAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("InventoryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("InvoiceAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("IoAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("IssuerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ItemAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("JobAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("JoinAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SigningKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SigningCertificate", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("SigningCertificatePath", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("CertificateThumbprint", StringComparison.OrdinalIgnoreCase)
            || IsCertificateCredentialSegment(segment);
    }

    private static bool IsCertificateCredentialSegment(ReadOnlySpan<char> segment)
    {
        return segment.EndsWith("CertificatePath", StringComparison.OrdinalIgnoreCase)
            || segment.EndsWith("CertificateThumbprint", StringComparison.OrdinalIgnoreCase)
            || segment.EndsWith("Certificate", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPrivateKeyCredentialSegment(ReadOnlySpan<char> segment)
    {
        const string privateKeyPemMarker = "PrivateKeyPem";

        int markerIndex = segment.IndexOf(privateKeyPemMarker.AsSpan(), StringComparison.OrdinalIgnoreCase);

        if (markerIndex < 0)
            return false;

        return !IsNegatedSensitiveFragment(segment, markerIndex, "PrivateKey");
    }

    private static bool IsEmbeddedSensitiveFragment(ReadOnlySpan<char> segment, int fragmentIndex)
    {
        if (fragmentIndex > 0 && char.IsLetter(segment[fragmentIndex - 1]))
            return true;

        return false;
    }

    private static bool IsNegatedSensitiveFragment(ReadOnlySpan<char> segment, int fragmentIndex, string fragment)
    {
        if (IsNonPrefixedNegation(segment, fragmentIndex))
            return true;

        if (IsNoPrefixedNegation(segment, fragmentIndex))
            return true;

        if (IsUnPrefixedNegation(segment, fragmentIndex))
            return true;

        if (fragment.Equals("Password", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("ConnectionString", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("Secret", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("Token", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("ApiKey", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        if (fragment.Equals("PrivateKey", StringComparison.OrdinalIgnoreCase)
            && fragmentIndex + fragment.Length < segment.Length
            && (segment.Slice(fragmentIndex + fragment.Length).StartsWith("less", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("free", StringComparison.OrdinalIgnoreCase)
                || segment.Slice(fragmentIndex + fragment.Length).StartsWith("izer", StringComparison.OrdinalIgnoreCase)))
            return true;

        return false;
    }

    private static bool IsNonPrefixedNegation(ReadOnlySpan<char> segment, int fragmentIndex)
    {
        ReadOnlySpan<char> before = segment.Slice(0, fragmentIndex);

        if (before.Length < 3)
            return false;

        return before.EndsWith("non", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNoPrefixedNegation(ReadOnlySpan<char> segment, int fragmentIndex)
    {
        ReadOnlySpan<char> before = segment.Slice(0, fragmentIndex);

        if (before.Length < 2)
            return false;

        return before.EndsWith("no", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsUnPrefixedNegation(ReadOnlySpan<char> segment, int fragmentIndex)
    {
        ReadOnlySpan<char> before = segment.Slice(0, fragmentIndex);

        if (before.Length < 2)
            return false;

        return before.EndsWith("un", StringComparison.OrdinalIgnoreCase);
    }
}
