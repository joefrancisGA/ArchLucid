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
    public void RedactValue_returns_marker()
    {
        AzureExtractorSensitivePropertyRedactor.RedactValue("super-secret").Should().Be("[REDACTED]");
    }
}
