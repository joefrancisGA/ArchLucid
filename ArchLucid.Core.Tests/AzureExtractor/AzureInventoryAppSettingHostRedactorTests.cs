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
    public void TryParseKeyVaultReference_extracts_vault_host_and_secret_name()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password");
    }
}
