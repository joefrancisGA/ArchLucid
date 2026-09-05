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
    public void RedactValue_returns_marker()
    {
        AzureExtractorSensitivePropertyRedactor.RedactValue("super-secret").Should().Be("[REDACTED]");
    }
}
