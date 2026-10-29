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
    public void TryParseKeyVaultReference_resolves_vault_name_with_percent_encoded_characters_without_decoding()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(VaultName=my%2Evault;SecretName=sql-password)");

        keyVaultHost.Should().Be("my%2evault.vault.azure.net");
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
    public void TryParseKeyVaultReference_extracts_secret_name_before_version_segment()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password/a1b2c3d4e5f6789012345678901234)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_uri_when_query_string_follows_secret_path()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password?api-version=7.0)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password?api-version=7.0");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_uri_when_fragment_follows_secret_path()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password#fragment)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password#fragment");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_host_when_userinfo_prefixes_authority()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://user@myvault.vault.azure.net/secrets/sql-password)");

        keyVaultHost.Should().Be("user@myvault.vault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_host_when_authority_includes_explicit_port()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net:443/secrets/sql-password)");

        keyVaultHost.Should().Be("myvault.vault.azure.net:443");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_returns_null_when_double_slash_precedes_secrets_path()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net//secrets/sql-password)");

        keyVaultHost.Should().BeNull();
        secretName.Should().BeNull();
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_when_secret_uri_uses_uppercase_https_scheme()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=HTTPS://myvault.vault.azure.net/secrets/sql-password)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_returns_null_when_secret_uri_uses_backslash_path_separators()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            @"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net\secrets\sql-password)");

        keyVaultHost.Should().BeNull();
        secretName.Should().BeNull();
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_semicolon()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/part1;part2)");

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be("part1;part2");
    }

    [Fact]
    public void TryParseKeyVaultReference_returns_null_when_vault_name_pair_contains_extra_semicolon_before_secret_name()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(VaultName=part1;part2;SecretName=sql-password)");

        keyVaultHost.Should().BeNull();
        secretName.Should().BeNull();
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_tab_character()
    {
        const string secretWithTab = "part1\tpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithTab})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithTab);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_newline_character()
    {
        const string secretWithNewline = "part1\npart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithNewline})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithNewline);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_carriage_return_character()
    {
        const string secretWithCr = "part1\rpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithCr})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithCr);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_vertical_tab_character()
    {
        const string secretWithVt = "part1\vpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithVt})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithVt);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_form_feed_character()
    {
        const string secretWithFf = "part1\fpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithFf})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithFf);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_backspace_character()
    {
        const string secretWithBackspace = "part1\u0008part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithBackspace})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithBackspace);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_bell_character()
    {
        const string secretWithBell = "part1\u0007part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithBell})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithBell);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_escape_character()
    {
        const string secretWithEscape = "part1\u001Bpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithEscape})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithEscape);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_file_separator_character()
    {
        const string secretWithFileSeparator = "part1\u001Cpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithFileSeparator})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithFileSeparator);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_group_separator_character()
    {
        const string secretWithGroupSeparator = "part1\u001Dpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithGroupSeparator})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithGroupSeparator);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_record_separator_character()
    {
        const string secretWithRecordSeparator = "part1\u001Epart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithRecordSeparator})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithRecordSeparator);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_unit_separator_character()
    {
        const string secretWithUnitSeparator = "part1\u001Fpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithUnitSeparator})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithUnitSeparator);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_delete_character()
    {
        const string secretWithDelete = "part1\u007Fpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithDelete})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithDelete);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_noncharacter()
    {
        const string secretWithNoncharacter = "part1\uFFFEmiddle";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithNoncharacter})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithNoncharacter);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_noncharacter_uFFFF()
    {
        const string secretWithNoncharacter = "part1\uFFFFpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithNoncharacter})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithNoncharacter);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_high_surrogate()
    {
        const string secretWithHighSurrogate = "part1\uD800part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithHighSurrogate})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithHighSurrogate);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_low_surrogate()
    {
        const string secretWithLowSurrogate = "part1\uDC00part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithLowSurrogate})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithLowSurrogate);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_private_use_character()
    {
        const string secretWithPrivateUse = "part1\uFDD0part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithPrivateUse})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithPrivateUse);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_replacement_character()
    {
        const string secretWithReplacement = "part1\uFFFDpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithReplacement})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithReplacement);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_byte_order_mark()
    {
        const string secretWithBom = "\uFEFFsql-password";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithBom})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithBom);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_object_replacement_character()
    {
        const string secretWithObjectReplacement = "part1\uFFFCpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithObjectReplacement})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithObjectReplacement);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_null_character()
    {
        const string secretWithNull = "part1\u0000part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithNull})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithNull);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_start_of_heading_character()
    {
        const string secretWithStartOfHeading = "part1\u0001part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithStartOfHeading})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithStartOfHeading);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_start_of_text_character()
    {
        const string secretWithStartOfText = "part1\u0002part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithStartOfText})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithStartOfText);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_end_of_text_character()
    {
        const string secretWithEndOfText = "part1\u0003part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithEndOfText})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithEndOfText);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_enquiry_character()
    {
        const string secretWithEnquiry = "part1\u0005part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithEnquiry})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithEnquiry);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_end_of_transmission_character()
    {
        const string secretWithEndOfTransmission = "part1\u0004part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithEndOfTransmission})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithEndOfTransmission);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_end_of_transmission_block_character()
    {
        const string secretWithEndOfTransmissionBlock = "part1\u0017part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithEndOfTransmissionBlock})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithEndOfTransmissionBlock);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_cancel_character()
    {
        const string secretWithCancel = "part1\u0018part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithCancel})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithCancel);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_end_of_medium_character()
    {
        const string secretWithEndOfMedium = "part1\u0019part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithEndOfMedium})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithEndOfMedium);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_substitute_character()
    {
        const string secretWithSubstitute = "part1\u001Apart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithSubstitute})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithSubstitute);
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_vault_host_when_secret_uri_host_contains_noncharacter_uFFFE()
    {
        const string vaultHostWithNoncharacter = "my\uFFFEmiddle.vault.azure.net";
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            $"@Microsoft.KeyVault(SecretUri=https://{vaultHostWithNoncharacter}/secrets/sql-password)");

        keyVaultHost.Should().Be(vaultHostWithNoncharacter.ToLowerInvariant());
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_vault_host_when_secret_uri_host_contains_noncharacter_uFFFF()
    {
        const string vaultHostWithNoncharacter = "my\uFFFFmiddle.vault.azure.net";
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            $"@Microsoft.KeyVault(SecretUri=https://{vaultHostWithNoncharacter}/secrets/sql-password)");

        keyVaultHost.Should().Be(vaultHostWithNoncharacter.ToLowerInvariant());
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_vault_host_when_secret_uri_host_contains_replacement_character()
    {
        const string vaultHostWithReplacement = "my\uFFFDmiddle.vault.azure.net";
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            $"@Microsoft.KeyVault(SecretUri=https://{vaultHostWithReplacement}/secrets/sql-password)");

        keyVaultHost.Should().Be(vaultHostWithReplacement.ToLowerInvariant());
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_extracts_secret_name_when_secret_segment_contains_noncharacter_uFFFE()
    {
        const string secretWithNoncharacter = "part1\uFFFEpart2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithNoncharacter})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithNoncharacter);
    }

    [Fact]
    public void TryParseKeyVaultReference_returns_null_when_secrets_path_uses_percent_encoded_slashes()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net%2Fsecrets%2Fsql-password)");

        keyVaultHost.Should().BeNull();
        secretName.Should().BeNull();
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
    public void TryParseKeyVaultReference_extracts_literal_percent_encoded_dot_in_vault_host()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault%2Evault.azure.net/secrets/sql-password)");

        keyVaultHost.Should().Be("myvault%2evault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_preserves_lowercase_percent_escape_in_vault_host()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://myvault%2e.vault.azure.net/secrets/sql-password)");

        keyVaultHost.Should().Be("myvault%2e.vault.azure.net");
        secretName.Should().Be("sql-password");
    }

    [Fact]
    public void TryParseKeyVaultReference_preserves_fully_percent_encoded_vault_host_in_secret_uri()
    {
        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(
            "@Microsoft.KeyVault(SecretUri=https://%6d%79%76%61%75%6c%74.vault.azure.net/secrets/sql-password)");

        keyVaultHost.Should().Be("%6d%79%76%61%75%6c%74.vault.azure.net");
        secretName.Should().Be("sql-password");
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
