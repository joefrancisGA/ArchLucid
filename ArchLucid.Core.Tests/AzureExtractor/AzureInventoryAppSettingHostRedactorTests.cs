using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAppSettingHostRedactorTests
{
    [Theory]
    [InlineData("Server=tcp:prodsql.database.windows.net,1433;Password=secret")]
    [InlineData("SharedAccessKey=abc")]
    [InlineData("AccountKey=abc")]
    public void ShouldRejectValue_detects_secret_markers(string value)
    {
        AzureInventoryAppSettingHostRedactor.ShouldRejectValue(value).Should().BeTrue();
    }

    [Fact]
    public void TryParseSettingValue_extracts_sql_host_and_catalog_when_password_present()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "Server=tcp:prodsql.database.windows.net,1433;Initial Catalog=archlucid;Password=s3cret-value");

        parsed.Should().NotBeNull();
        parsed!.Host.Should().Be("prodsql.database.windows.net");
        parsed.Catalog.Should().Be("archlucid");
    }

    [Theory]
    [InlineData("AccountKey=abc")]
    [InlineData("SharedAccessKey=abc")]
    public void TryParseSettingValue_returns_null_for_secret_only_values(string value)
    {
        AzureInventoryAppSettingHostRedactor.TryParseSettingValue(value).Should().BeNull();
    }

    [Fact]
    public void TryParseSqlHost_extracts_hostname_without_password()
    {
        string? host = AzureInventoryAppSettingHostRedactor.TryParseSqlHost(
            "Server=tcp:prodsql.database.windows.net,1433;Initial Catalog=db;");

        host.Should().Be("prodsql.database.windows.net");
    }

    [Fact]
    public void TryParseSettingValue_extracts_sql_host_from_data_source_alias()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "Data Source=tcp:prodsql.database.windows.net,1433;Initial Catalog=archlucid;");

        parsed.Should().NotBeNull();
        parsed!.Host.Should().Be("prodsql.database.windows.net");
        parsed.Catalog.Should().Be("archlucid");
    }

    [Fact]
    public void TryParseSettingValue_extracts_sql_host_from_postgresql_host_alias()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "Host=prodsql.postgres.database.azure.com;Database=archlucid;Password=s3cret-value");

        parsed.Should().NotBeNull();
        parsed!.Host.Should().Be("prodsql.postgres.database.azure.com");
        parsed.Catalog.Should().Be("archlucid");
    }

    [Fact]
    public void TryParseSettingValue_extracts_sql_host_and_catalog()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "Server=tcp:prodsql.database.windows.net,1433;Initial Catalog=archlucid;");

        parsed.Should().NotBeNull();
        parsed!.Host.Should().Be("prodsql.database.windows.net");
        parsed.Catalog.Should().Be("archlucid");
    }

    [Fact]
    public void TryParseSettingValue_parses_blob_https_host()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "https://starchlucidevarts.blob.core.windows.net/");

        parsed.Should().NotBeNull();
        parsed!.Host.Should().Be("starchlucidevarts.blob.core.windows.net");
    }

    [Fact]
    public void TryParseSettingValue_parses_vault_https_host()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "https://kvrgexample.vault.azure.net/");

        parsed.Should().NotBeNull();
        parsed!.KeyVaultHost.Should().Be("kvrgexample.vault.azure.net");
        parsed.Host.Should().BeNull();
    }

    [Fact]
    public void TryParseSettingValue_parses_container_app_https_host()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "https://archlucid-api.eastus2.azurecontainerapps.io");

        parsed.Should().NotBeNull();
        parsed!.Host.Should().Be("archlucid-api.eastus2.azurecontainerapps.io");
    }

    [Fact]
    public void TryParseSettingValue_returns_template_warning_without_catalog()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "Server=tcp:prodsql.database.windows.net,1433;Initial Catalog={0};");

        parsed.Should().NotBeNull();
        parsed!.Host.Should().Be("prodsql.database.windows.net");
        parsed.Catalog.Should().BeNull();
        parsed.WarningCode.Should().Be(AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsCatalogTemplate);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_vault_host_and_secret_name()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_vault_host_from_vault_name_reference()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(VaultName=myvault;SecretName=sql-password)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_preserves_vault_host_when_vault_name_is_sovereign_cloud_fqdn()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(VaultName=myvault.vault.usgovcloudapi.net;SecretName=sql-password)");

        keyVaultHost.Should().Be("myvault.vault.usgovcloudapi.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseSettingValue_parses_key_vault_vault_name_reference()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "@Microsoft.KeyVault(VaultName=myvault;SecretName=sql-password)");

        parsed.Should().NotBeNull();
        parsed!.KeyVaultHost.Should().Be("myvault.vault.azure.net");
        parsed.SecretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_returns_null_when_secret_uri_has_double_slash_before_secrets_segment()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net//secrets/sql-password)");

        keyVaultHost.Should().BeNull();
        secretName.Should().BeNull();
    }

    [Fact]
    public void TryParseKeyVaultReference_returns_null_when_secret_uri_has_trailing_slash_without_secret_name()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/)");

        keyVaultHost.Should().BeNull();
        secretName.Should().BeNull();
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_uri_has_trailing_slash_after_secret_name()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password/)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_uri_has_double_slash_before_version_segment()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password//a1b2c3d4e5f6789012345678901234)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_preserves_percent_encoded_slash_in_secret_name_segment()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/my%2Fsecret-name)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("my%2Fsecret-name");
    }

    [Fact]
    public void TryParseSettingValue_extracts_postgresql_host_when_host_alias_uses_tcp_prefix_and_comma_port()
    {
        AzureInventoryAppSettingHostParsedFields? parsed = AzureInventoryAppSettingHostRedactor.TryParseSettingValue(
            "Host=tcp:pg.postgres.database.azure.com,5432;Database=archlucid;Password=s3cret-value");

        parsed.Should().NotBeNull();
        parsed!.Host.Should().Be("pg.postgres.database.azure.com");
    }
}
