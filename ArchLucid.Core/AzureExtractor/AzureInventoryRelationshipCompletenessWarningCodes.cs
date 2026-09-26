namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Stable completeness warning codes when relationship classes are missing from a snapshot (IE-RF-09).
/// </summary>
public static class AzureInventoryRelationshipCompletenessWarningCodes
{
    public const string ArgVmNicMissing = "arg-vm-nic-missing";

    public const string ArgNicSubnetMissing = "arg-nic-subnet-missing";

    public const string ArgPeTargetMissing = "arg-pe-target-missing";

    public const string ArgVnetPeeringMissing = "arg-vnet-peering-missing";

    public const string HostedNicListFailed = "hosted-nic-list-failed";

    public const string ArmFallbackThinProperties = "arm-fallback-thin-properties";

    public const string AgwBackendFqdnUnresolved = "agw-backend-fqdn-unresolved";

    public const string AssociationTypeUnmappedPrefix = "association-type-unmapped:";

    public const string EffectiveControlsCapped = "effective-controls-capped";

    public const string AdfLinkedServicesMissing = "adf-linked-services-missing";

    public const string AdfFactoryHasNoLinkedServices = "adf-factory-has-no-linked-services";

    public const string AdfPipelineFlowsMissing = "adf-pipeline-flows-missing";

    public const string AdfDatasetsMissing = "adf-datasets-missing";

    public const string AdfTriggersMissing = "adf-triggers-missing";

    public const string SynapsePipelineFlowsMissing = "synapse-pipeline-flows-missing";

    public const string LogicAppStandardNotCollected = "logic-app-standard-not-collected";

    public const string LogicAppConnectionsMissing = "logic-app-connections-missing";

    public const string AppSettingsNotCollectedHostedGetOnly = "app-settings-not-collected-hosted-get-only";

    public const string AppSettingsHostUnresolved = "app-settings-host-unresolved";

    public const string AppSettingsCatalogTemplate = "app-settings-catalog-template";

    public const string AppSettingsSqlCatalogMissing = "app-settings-sql-catalog-missing";

    public const string AppSettingsHostsContainerAppsEnvMissing = "app-settings-hosts-container-apps-env-missing";

    public const string PeReachableDnsLinkMissing = "pe-reachable-dns-link-missing";
}
