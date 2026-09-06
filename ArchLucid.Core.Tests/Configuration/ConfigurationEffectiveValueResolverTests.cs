using ArchLucid.Core.Configuration.Summary;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Tests.Configuration;
[Trait("Category", "Unit")]

public sealed class ConfigurationEffectiveValueResolverTests
{
    [Fact]
    public void Resolve_returns_null_when_unset()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, "Missing:Key", isSet: false);

        v.Should().BeNull();
    }

    [Fact]
    public void Resolve_redacts_connection_strings()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ConnectionStrings:ArchLucid"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ConnectionStrings:ArchLucid",
            isSet: true);

        v.Should().Be("***");
    }

    [Fact]
    public void Resolve_returns_scalar_when_not_sensitive()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:StorageProvider"] = "Sql"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, "ArchLucid:StorageProvider", isSet: true);

        v.Should().Be("Sql");
    }

    [Fact]
    public void Resolve_redacts_private_key_config_paths()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Trial:LocalIdentity:JwtPrivateKeyPemPath"] = "/secrets/jwt.pem"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Trial:LocalIdentity:JwtPrivateKeyPemPath",
            isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:Auth:ClientSecret")]
    [InlineData("Azure:Storage:PrimaryKey")]
    [InlineData("Azure:Storage:AccountKey")]
    public void Resolve_redacts_explicit_credential_config_paths(string configPath)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:Auth:SigningCertificatePath", "/secrets/signing.pfx")]
    [InlineData("ArchLucid:Saml:SigningCertificate", "/secrets/signing.pfx")]
    public void Resolve_redacts_certificate_config_paths(string configPath, string secretValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = secretValue
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_signing_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:Auth:SigningKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ArchLucid:Auth:SigningKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shared_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SharedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SharedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_secondary_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SecondaryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SecondaryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_primary_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PrimaryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PrimaryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_account_shared_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AccountSharedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AccountSharedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_storage_account_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StorageAccountKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StorageAccountKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_blob_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BlobAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BlobAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_file_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FileAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FileAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_queue_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:QueueAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:QueueAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_table_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TableAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TableAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_disk_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DiskAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DiskAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_web_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:WebAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:WebAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_manage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ManageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ManageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_dfs_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DfsAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DfsAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cosmos_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CosmosAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CosmosAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_api_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ApiAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ApiAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_data_lake_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DataLakeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DataLakeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_service_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ServiceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ServiceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_event_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EventAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EventAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_portal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PortalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PortalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_admin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AdminAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AdminAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sas_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SasAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SasAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_backup_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BackupAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BackupAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_master_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MasterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MasterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_root_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RootAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RootAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_account_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AccountAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AccountAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_storage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StorageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StorageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_key_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:KeyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:KeyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_default_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DefaultAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DefaultAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_global_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:GlobalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:GlobalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_shared_key_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SharedKeyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SharedKeyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_custom_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CustomAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CustomAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_local_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LocalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LocalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_remote_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RemoteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RemoteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_temp_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TempAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TempAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_temporary_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:TemporaryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:TemporaryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_external_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExternalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExternalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_internal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InternalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InternalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_primary_storage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PrimaryStorageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PrimaryStorageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_secondary_storage_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SecondaryStorageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SecondaryStorageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rotated_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RotatedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RotatedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_legacy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LegacyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LegacyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_staged_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:StagedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:StagedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_connector_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ConnectorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ConnectorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_deprecated_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DeprecatedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DeprecatedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_fallback_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FallbackAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FallbackAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_integration_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IntegrationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IntegrationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_migration_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MigrationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MigrationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_partner_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PartnerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PartnerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_replica_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReplicaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReplicaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_archive_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ArchiveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ArchiveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_disaster_recovery_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DisasterRecoveryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DisasterRecoveryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_replication_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReplicationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReplicationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_audit_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AuditAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AuditAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_automation_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:AutomationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:AutomationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_batch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BatchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BatchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bootstrap_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BootstrapAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BootstrapAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_broker_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BrokerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BrokerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_bridge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:BridgeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:BridgeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cache_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CacheAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CacheAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_channel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ChannelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ChannelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_client_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClientAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClientAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cluster_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ClusterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ClusterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cloud_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CloudAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CloudAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_compute_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ComputeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ComputeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_config_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ConfigAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ConfigAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_connection_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ConnectionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ConnectionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_container_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ContainerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ContainerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_control_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ControlAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ControlAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_core_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CoreAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CoreAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_content_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ContentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ContentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_copy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CopyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CopyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_corporate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CorporateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CorporateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_credential_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CredentialAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CredentialAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_customer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CustomerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CustomerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_cross_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CrossAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CrossAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_crypto_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:CryptoAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:CryptoAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_data_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DataAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DataAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_database_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DatabaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DatabaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_dedicated_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DedicatedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DedicatedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_deployment_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DeploymentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DeploymentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_developer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DeveloperAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DeveloperAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_device_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DeviceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DeviceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_direct_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DirectAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DirectAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_digital_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DigitalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DigitalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_directory_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DirectoryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DirectoryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_distributed_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DistributedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DistributedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_document_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DocumentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DocumentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_domain_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DomainAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DomainAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_drill_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DrillAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DrillAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_drive_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DriveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DriveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_dynamic_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:DynamicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:DynamicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_edge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EdgeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EdgeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_email_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EmailAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EmailAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_embedded_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EmbeddedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EmbeddedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_emergency_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EmergencyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EmergencyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_encryption_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EncryptionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EncryptionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_enterprise_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EnterpriseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EnterpriseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_entry_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EntryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EntryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_environment_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:EnvironmentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:EnvironmentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_exchange_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExchangeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExchangeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_execution_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExecutionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExecutionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_export_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExportAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExportAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_extension_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ExtensionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ExtensionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_federated_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FederatedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FederatedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_fetch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FetchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FetchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_filter_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FilterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FilterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_final_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FinalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FinalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_finance_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FinanceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FinanceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_firewall_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FirewallAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FirewallAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_flag_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FlagAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FlagAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_fleet_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FleetAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FleetAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_flow_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FlowAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FlowAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_folder_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FolderAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FolderAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_forward_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ForwardAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ForwardAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_foundation_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FoundationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FoundationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_front_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FrontAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FrontAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_full_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:FullAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:FullAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_gateway_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:GatewayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:GatewayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_group_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:GroupAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:GroupAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_guest_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:GuestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:GuestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_handle_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HandleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HandleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_hash_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HashAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HashAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_health_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HealthAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HealthAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_host_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HostAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HostAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_hub_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HubAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HubAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_hybrid_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:HybridAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:HybridAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_identity_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IdentityAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IdentityAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_image_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ImageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ImageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_import_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ImportAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ImportAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_index_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IndexAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IndexAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_instance_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InstanceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InstanceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_interactive_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InteractiveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InteractiveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_inventory_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InventoryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InventoryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_invoice_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:InvoiceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:InvoiceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_io_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IoAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IoAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_issuer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:IssuerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:IssuerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_item_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ItemAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ItemAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_job_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JobAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JobAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_join_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JoinAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JoinAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_journal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JournalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JournalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_json_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JsonAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JsonAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_jump_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:JumpAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:JumpAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_kernel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:KernelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:KernelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_kafka_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:KafkaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:KafkaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_keeper_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:KeeperAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:KeeperAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_label_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LabelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LabelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lambda_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LambdaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LambdaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_layer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LayerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LayerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lead_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LeadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LeadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lease_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LeaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LeaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_library_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LibraryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LibraryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_link_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LinkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LinkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_live_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LiveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LiveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_load_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LoadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LoadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lock_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LockAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LockAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_log_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LogAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LogAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_login_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LoginAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LoginAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_long_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LongAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LongAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_lookup_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LookupAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LookupAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_loop_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LoopAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LoopAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_low_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:LowAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:LowAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_machine_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MachineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MachineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_managed_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ManagedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ManagedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_map_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MapAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MapAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_member_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MemberAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MemberAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_memory_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MemoryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MemoryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_merge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MergeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MergeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_message_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MessageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MessageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_metric_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MetricAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MetricAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_mirror_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MirrorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MirrorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_mobile_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MobileAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MobileAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_model_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ModelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ModelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_module_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ModuleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ModuleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_monitor_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MonitorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MonitorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_month_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MonthAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MonthAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_mounted_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MountedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MountedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_motion_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MotionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MotionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_mount_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MountAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MountAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_move_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MoveAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MoveAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_multi_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MultiAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MultiAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_music_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:MusicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:MusicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_named_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NamedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NamedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_native_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NativeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NativeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_network_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NetworkAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NetworkAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_node_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NodeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NodeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_normal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NormalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NormalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_notebook_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:NotebookAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:NotebookAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_object_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ObjectAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ObjectAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_offline_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OfflineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OfflineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_online_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OnlineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OnlineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_open_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OpenAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OpenAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_operator_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OperatorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OperatorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_ops_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OpsAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OpsAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_option_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OptionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OptionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_order_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OrderAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OrderAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_org_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OrgAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OrgAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_origin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OriginAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OriginAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_output_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OutputAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OutputAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_overlay_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OverlayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OverlayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_owner_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:OwnerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:OwnerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pack_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PackAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PackAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_page_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PageAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PageAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_parallel_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ParallelAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ParallelAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_parent_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ParentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ParentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_partial_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PartialAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PartialAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pattern_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PatternAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PatternAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_patch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PatchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PatchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_path_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PathAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PathAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_payload_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PayloadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PayloadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_payment_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PaymentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PaymentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_peer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PeerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PeerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pending_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PendingAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PendingAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_performance_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PerformanceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PerformanceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_permission_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PermissionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PermissionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pipeline_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PipelineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PipelineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_platform_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PlatformAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PlatformAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_plugin_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PluginAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PluginAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_point_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PointAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PointAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_policy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PolicyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PolicyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pool_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PoolAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PoolAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_port_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PortAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PortAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_post_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PostAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PostAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_power_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PowerAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PowerAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_premium_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PremiumAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PremiumAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_prepared_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PreparedAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PreparedAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_preview_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PreviewAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PreviewAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_private_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PrivateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PrivateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_process_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProcessAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProcessAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_profile_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProfileAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProfileAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_program_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProgramAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProgramAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_project_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProjectAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProjectAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_provision_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProvisionAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProvisionAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_proxy_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ProxyAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ProxyAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_public_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PublicAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PublicAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_publisher_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PublisherAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PublisherAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_pulse_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PulseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PulseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_push_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PushAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PushAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_purge_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PurgeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PurgeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_put_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:PutAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:PutAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_query_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:QueryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:QueryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_quota_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:QuotaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:QuotaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_random_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RandomAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RandomAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_range_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RangeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RangeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_read_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReadAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReadAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_record_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RecordAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RecordAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_recovery_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RecoveryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RecoveryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_redact_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RedactAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RedactAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_refer_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReferAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReferAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_refresh_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RefreshAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RefreshAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_relay_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RelayAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RelayAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_release_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReleaseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReleaseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_registry_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RegistryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RegistryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_remediation_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RemediationAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RemediationAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_render_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RenderAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RenderAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_renewal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RenewalAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RenewalAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_report_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReportAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReportAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_request_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RequestAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RequestAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_resource_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ResourceAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ResourceAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_response_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ResponseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ResponseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_restore_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RestoreAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RestoreAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_result_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ResultAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ResultAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_retry_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RetryAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RetryAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_return_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReturnAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReturnAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_reverse_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReverseAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReverseAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_reveal_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RevealAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RevealAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_review_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ReviewAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ReviewAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_revoke_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RevokeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RevokeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_roll_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RollAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RollAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_room_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RoomAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RoomAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rotate_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RotateAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RotateAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_route_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RouteAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RouteAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_router_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RouterAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RouterAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_routine_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RoutineAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RoutineAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rule_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RuleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RuleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_run_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RunAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RunAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_runtime_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RuntimeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RuntimeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rubric_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RubricAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RubricAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rural_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RuralAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RuralAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_rust_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:RustAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:RustAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sale_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SaleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SaleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sample_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SampleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SampleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sandbox_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SandboxAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SandboxAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scale_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScaleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScaleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scan_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScanAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScanAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_schedule_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScheduleAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScheduleAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_schema_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SchemaAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SchemaAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scope_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScopeAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScopeAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_score_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScoreAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScoreAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scout_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScoutAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScoutAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scratch_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScratchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScratchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_screen_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScreenAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScreenAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_script_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScriptAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScriptAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_scroll_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:ScrollAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:ScrollAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_search_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SearchAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SearchAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_seat_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SeatAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SeatAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_segment_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SegmentAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SegmentAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_select_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SelectAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SelectAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_self_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SelfAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SelfAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_send_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SendAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SendAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_sensor_access_key_config_path()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Azure:Storage:SensorAccessKey"] = "super-secret"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "Azure:Storage:SensorAccessKey",
            isSet: true);

        value.Should().Be("***");
    }

    [Fact]
    public void Resolve_redacts_certificate_thumbprint_config_path_matching_azure_redactor()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:Auth:CertificateThumbprint"] = "ABCDEF123456"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? value = ConfigurationEffectiveValueResolver.Resolve(
            configuration,
            "ArchLucid:Auth:CertificateThumbprint",
            isSet: true);

        value.Should().Be("***");
    }

    [Theory]
    [InlineData("ArchLucid:PasswordlessAuth:Enabled", "true")]
    [InlineData("ArchLucid:TokenizerModel:Name", "gpt-4.1")]
    [InlineData("ArchLucid:ApiKeylessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:ConnectionStringFreeSettings:Enabled", "true")]
    [InlineData("ArchLucid:ConnectionStringlessSettings:Enabled", "true")]
    [InlineData("ArchLucid:SecretizerModule:Name", "module-a")]
    [InlineData("ArchLucid:ApiKeyizerModule:Name", "module-a")]
    [InlineData("ArchLucid:ConnectionStringizerSettings:Enabled", "true")]
    [InlineData("ArchLucid:PasswordizerAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:PasswordFreeAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:SecretFreeStorage:Bucket", "logs")]
    [InlineData("ArchLucid:TokenFreeAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:TokenlessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:ApiKeyFreeAuth:Mode", "managed-identity")]
    [InlineData("Features:NonSecretStorage:Bucket", "logs")]
    [InlineData("ArchLucid:PrivateKeylessAuth:Mode", "managed-identity")]
    [InlineData("ArchLucid:PrivateKeyizerModule:Name", "module-a")]
  public void Resolve_returns_scalar_for_non_secret_segment_substrings(string configPath, string expectedValue)
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            [configPath] = expectedValue
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data!).Build();

        string? v = ConfigurationEffectiveValueResolver.Resolve(configuration, configPath, isSet: true);

        v.Should().Be(expectedValue);
    }
}
