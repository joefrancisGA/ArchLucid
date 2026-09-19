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
    public void ShouldRejectValue_blocks_secret_like_content(string value)
    {
        AzureInventoryAppSettingHostRedactor.ShouldRejectValue(value).Should().BeTrue();
    }

    [Fact]
    public void TryParseSqlHost_extracts_hostname_without_password()
    {
        string? host = AzureInventoryAppSettingHostRedactor.TryParseSqlHost(
            "Server=tcp:prodsql.database.windows.net,1433;Initial Catalog=db;");

        host.Should().Be("prodsql.database.windows.net");
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
}
