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
            || segment.Equals("JournalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("JsonAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("JumpAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("KernelAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("KafkaAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("KeeperAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LabelAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LambdaAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LayerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LeadAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LeaseAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LibraryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LinkAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LiveAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LoadAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LockAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LogAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LoginAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LongAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LookupAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LoopAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("LowAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MachineAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ManagedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MapAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MemberAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MemoryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MergeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MessageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MetricAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MirrorAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MobileAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ModelAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ModuleAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MonitorAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MonthAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MountedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MotionAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MountAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MoveAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MultiAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("MusicAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("NamedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("NativeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("NetworkAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("NodeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("NormalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("NotebookAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ObjectAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OfflineAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OnlineAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OpenAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OperatorAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OpsAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OptionAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OrderAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OrgAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OriginAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OutputAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OverlayAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("OwnerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PackAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PageAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ParallelAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ParentAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PartialAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PatchAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PathAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PatternAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PayloadAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PaymentAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PeerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PendingAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PerformanceAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PermissionAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PipelineAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PlatformAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PluginAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PointAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PolicyAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PoolAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PortAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PostAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PowerAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PremiumAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PreparedAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PreviewAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PrivateAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ProcessAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ProfileAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ProgramAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ProjectAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ProvisionAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ProxyAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PublicAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PublisherAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PulseAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PushAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PurgeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("PutAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("QueryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("QuotaAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RandomAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RangeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RateAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReadAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RecordAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RecoveryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RedactAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReferAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RefreshAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RelayAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReleaseAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RegistryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RemediationAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RenderAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RenewalAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReportAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RequestAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ResourceAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ResponseAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RestoreAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ResultAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RetryAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReturnAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReverseAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RevealAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("ReviewAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RevokeAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RollAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RoomAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RotateAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RouteAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RouterAccessKey", StringComparison.OrdinalIgnoreCase)
            || segment.Equals("RoutineAccessKey", StringComparison.OrdinalIgnoreCase)
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
