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
    public void IsSensitiveKey_detects_front_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("frontAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_full_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("fullAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_gateway_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("gatewayAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_group_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("groupAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_guest_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("guestAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_handle_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("handleAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_hash_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("hashAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_health_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("healthAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_host_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("hostAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_hub_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("hubAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_hybrid_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("hybridAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_identity_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("identityAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_image_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("imageAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_import_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("importAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_index_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("indexAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_instance_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("instanceAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_interactive_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("interactiveAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_inventory_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("inventoryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_invoice_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("invoiceAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_io_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("ioAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_issuer_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("issuerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_item_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("itemAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_job_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("jobAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_join_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("joinAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_journal_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("journalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_json_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("jsonAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_jump_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("jumpAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_kernel_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("kernelAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_kafka_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("kafkaAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_keeper_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("keeperAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_label_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("labelAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_lambda_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("lambdaAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_layer_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("layerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_lead_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("leadAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_lease_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("leaseAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_library_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("libraryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_link_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("linkAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_live_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("liveAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_load_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("loadAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_lock_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("lockAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_log_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("logAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_login_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("loginAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_long_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("longAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_lookup_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("lookupAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_loop_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("loopAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_low_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("lowAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_machine_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("machineAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_managed_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("managedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_map_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("mapAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_member_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("memberAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_memory_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("memoryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_merge_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("mergeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_message_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("messageAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_metric_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("metricAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_mirror_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("mirrorAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_mobile_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("mobileAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_model_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("modelAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_module_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("moduleAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_monitor_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("monitorAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_month_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("monthAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_mounted_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("mountedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_motion_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("motionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_mount_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("mountAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_move_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("moveAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_multi_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("multiAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_music_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("musicAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_named_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("namedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_native_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("nativeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_network_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("networkAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_node_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("nodeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_normal_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("normalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_notebook_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("notebookAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_object_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("objectAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_offline_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("offlineAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_online_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("onlineAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_open_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("openAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_operator_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("operatorAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_ops_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("opsAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_option_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("optionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_order_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("orderAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_org_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("orgAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_origin_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("originAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_output_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("outputAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_overlay_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("overlayAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_owner_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("ownerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_pack_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("packAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_page_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("pageAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_parallel_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("parallelAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_parent_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("parentAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_partial_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("partialAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_pattern_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("patternAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_patch_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("patchAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_path_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("pathAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_payload_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("payloadAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_payment_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("paymentAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_peer_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("peerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_pending_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("pendingAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_performance_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("performanceAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_permission_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("permissionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_pipeline_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("pipelineAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_platform_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("platformAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_plugin_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("pluginAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_point_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("pointAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_policy_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("policyAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_pool_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("poolAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_port_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("portAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_post_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("postAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_power_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("powerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_premium_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("premiumAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_prepared_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("preparedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_preview_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("previewAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_private_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("privateAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_process_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("processAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_profile_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("profileAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_program_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("programAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_project_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("projectAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_provision_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("provisionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_proxy_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("proxyAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_public_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("publicAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_publisher_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("publisherAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_pulse_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("pulseAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_push_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("pushAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_purge_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("purgeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_put_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("putAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_query_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("queryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_quota_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("quotaAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_random_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("randomAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_range_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("rangeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_rate_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("rateAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_read_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("readAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_record_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("recordAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_recovery_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("recoveryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_redact_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("redactAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_refer_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("referAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_refresh_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("refreshAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_relay_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("relayAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_release_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("releaseAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_registry_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("registryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_remediation_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("remediationAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_render_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("renderAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_renewal_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("renewalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_report_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("reportAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_request_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("requestAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_resource_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("resourceAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_response_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("responseAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_restore_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("restoreAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_result_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("resultAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_retry_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("retryAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_return_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("returnAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_reverse_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("reverseAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_reveal_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("revealAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_review_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("reviewAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_revoke_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("revokeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_roll_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("rollAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_room_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("roomAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_rotate_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("rotateAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_route_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("routeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_router_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("routerAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_routine_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("routineAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_rule_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("ruleAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_run_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("runAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_runtime_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("runtimeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_rubric_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("rubricAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_rural_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("ruralAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_rust_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("rustAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_sale_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("saleAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_sample_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sampleAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_sandbox_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sandboxAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_scale_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scaleAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_scan_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scanAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_schedule_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scheduleAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_schema_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("schemaAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_scope_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scopeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_score_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scoreAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_scout_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scoutAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_scratch_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scratchAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_screen_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("screenAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_script_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scriptAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_scroll_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("scrollAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_search_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("searchAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_seat_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("seatAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_segment_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("segmentAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_select_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("selectAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_self_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("selfAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_send_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sendAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_sensor_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sensorAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_serial_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("serialAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_server_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("serverAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_session_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sessionAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_setup_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("setupAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_share_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("shareAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_shelf_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("shelfAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_shield_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("shieldAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_shift_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("shiftAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_ship_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("shipAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_shop_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("shopAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_short_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("shortAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_show_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("showAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_shot_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("shotAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_side_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sideAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_signal_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("signalAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_single_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("singleAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_sink_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sinkAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_site_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("siteAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_size_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sizeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_skin_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("skinAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_skip_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("skipAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_slide_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("slideAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_slot_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("slotAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_small_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("smallAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_smart_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("smartAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_smoke_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("smokeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_snap_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("snapAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_soft_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("softAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_solid_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("solidAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_socket_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("socketAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_source_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("sourceAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_sound_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("soundAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_space_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("spaceAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_speed_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("speedAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_spell_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("spellAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_split_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("splitAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_spot_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("spotAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_stack_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("stackAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_stage_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("stageAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_stand_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("standAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_star_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("starAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_start_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("startAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_state_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("stateAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_static_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("staticAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_steam_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("steamAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_store_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("storeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_stream_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("streamAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_strict_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("strictAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_string_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("stringAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_structured_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("structuredAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_studio_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("studioAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_stripe_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("stripeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_strong_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("strongAccessKey").Should().BeTrue();
    }

    [Fact]
    public void IsSensitiveKey_detects_strike_access_key_property_names_matching_config_redactor()
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey("strikeAccessKey").Should().BeTrue();
    }

    [Fact]
    public void RedactValue_returns_marker()
    {
        AzureExtractorSensitivePropertyRedactor.RedactValue("super-secret").Should().Be("[REDACTED]");
    }
}
