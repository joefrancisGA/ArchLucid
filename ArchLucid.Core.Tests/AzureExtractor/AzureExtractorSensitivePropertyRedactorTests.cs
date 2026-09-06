using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorSensitivePropertyRedactorTests
{
    [Theory]
    [InlineData("connectionString", true)]
    [InlineData("primaryKey", true)]
    [InlineData("location", false)]
    [InlineData("nonsecret", false)]
    [InlineData("passwordless", false)]
    [InlineData("connectionstringfree", false)]
    [InlineData("passwordfreeauth", false)]
    [InlineData("apikeyfreeauth", false)]
    [InlineData("accesskeyfreeauth", false)]
    [InlineData("secretfreeauth", false)]
    [InlineData("secretizer", false)]
    [InlineData("passwordizer", false)]
    [InlineData("secretless", false)]
    [InlineData("accesskeyless", false)]
    [InlineData("primarykeyless", false)]
    [InlineData("secondarykeyless", false)]
    [InlineData("accountkeyless", false)]
    [InlineData("clientsecretless", false)]
    [InlineData("privatekeyless", false)]
    [InlineData("sharedAccessKey", true)]
    [InlineData("signingCertificate", true)]
  public void IsSensitiveKey_detects_secret_like_names(string key, bool expected)
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(key).Should().Be(expected);
    }

    [Fact]
    public void IsSensitiveKey_detects_shared_access_key_property_names()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sharedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_signing_certificate_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("signingCertificate").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_signing_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("signingKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_signing_certificate_path_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("signingCertificatePath").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_primary_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("primaryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_storage_account_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("storageAccountKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_blob_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("blobAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_file_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("fileAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_queue_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("queueAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_table_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("tableAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_disk_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("diskAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_web_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("webAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_manage_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("manageAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_dfs_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("dfsAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_cosmos_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("cosmosAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_api_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("apiAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_data_lake_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("dataLakeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_service_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("serviceAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_event_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("eventAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_portal_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("portalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_admin_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("adminAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_sas_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sasAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_backup_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("backupAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_master_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("masterAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_root_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("rootAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_account_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("accountAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_storage_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("storageAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_key_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("keyAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_default_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("defaultAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_global_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("globalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_shared_key_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sharedKeyAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_custom_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("customAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_local_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("localAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_remote_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("remoteAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_temp_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("tempAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_temporary_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("temporaryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_external_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("externalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_internal_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("internalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_primary_storage_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("primaryStorageAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_secondary_storage_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("secondaryStorageAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_rotated_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("rotatedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_legacy_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("legacyAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_staged_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("stagedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_connector_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("connectorAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_deprecated_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("deprecatedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_fallback_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("fallbackAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_integration_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("integrationAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_migration_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("migrationAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_partner_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("partnerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_replica_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("replicaAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_archive_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("archiveAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_disaster_recovery_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("disasterRecoveryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_replication_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("replicationAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_audit_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("auditAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_automation_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("automationAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_batch_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("batchAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_bootstrap_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("bootstrapAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_broker_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("brokerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_bridge_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("bridgeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_cache_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("cacheAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_channel_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("channelAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_client_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("clientAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_cluster_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("clusterAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_cloud_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("cloudAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_compute_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("computeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_config_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("configAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_connection_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("connectionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_container_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("containerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_control_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("controlAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_core_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("coreAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_content_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("contentAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_copy_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("copyAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_corporate_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("corporateAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_credential_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("credentialAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_customer_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("customerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_cross_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("crossAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_crypto_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("cryptoAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_data_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("dataAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_database_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("databaseAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_dedicated_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("dedicatedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_deployment_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("deploymentAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_developer_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("developerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_device_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("deviceAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_direct_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("directAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_digital_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("digitalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_directory_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("directoryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_distributed_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("distributedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_document_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("documentAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_domain_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("domainAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_drill_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("drillAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_drive_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("driveAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_dynamic_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("dynamicAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_edge_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("edgeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_email_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("emailAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_embedded_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("embeddedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_emergency_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("emergencyAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_encryption_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("encryptionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_enterprise_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("enterpriseAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_entry_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("entryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_environment_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("environmentAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_exchange_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("exchangeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_execution_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("executionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_export_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("exportAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_extension_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("extensionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_federated_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("federatedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_fetch_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("fetchAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_filter_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("filterAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_final_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("finalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_finance_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("financeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_firewall_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("firewallAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_flag_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("flagAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_fleet_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("fleetAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_flow_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("flowAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_folder_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("folderAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_forward_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("forwardAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_foundation_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("foundationAccessKey").Should().BeTrue();
    }

    [Fact]
    public void RedactValue_returns_marker()
    {
        AzureExtractorSensitivePropertyRedactor.RedactValue("super-secret").Should().Be("[REDACTED]");
    }
}
